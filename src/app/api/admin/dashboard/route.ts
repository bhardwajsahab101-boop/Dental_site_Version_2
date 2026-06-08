import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { Patient } from "../../../../models/Patient";
import { Appointment } from "../../../../models/Appointment";
import { Treatment } from "../../../../models/treatment";
import { getCurrentClinic } from "../../../../lib/auth";
 
export const dynamic = "force-dynamic";
 
export async function GET() {
  try {
    const clinicId = await getCurrentClinic();

    // Log the user context for authorization tracing
    let userId = undefined;
    let role = undefined;
    let clinicSlug = undefined;
    let currentHost = "";
    let detectedSlug = "default";

    try {
      const { cookies, headers } = await import("next/headers");
      const cookieStore = await cookies();
      const token = cookieStore.get("admin_token")?.value;
      if (token) {
        const { verifyJWT } = await import("../../../../lib/auth");
        const secret = process.env.JWT_SECRET || "default_secret";
        const verified = await verifyJWT(token, secret);
        if (verified) {
          userId = verified.userId;
          role = verified.role;
          clinicSlug = verified.clinicSlug;
        }
      }
      const headersList = await headers();
      currentHost = headersList.get("host") || "";
      const { getSubdomainSlug } = await import("../../../../lib/subdomain");
      detectedSlug = getSubdomainSlug(currentHost);
    } catch (err) {
      console.error("Error gathering logs for dashboard route:", err);
    }

    console.log({
      userId,
      role,
      clinicId,
      clinicSlug,
      currentHost,
      detectedSlug
    });

    if (!clinicId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }
 
    await connectDB();
 
    const clinicFilter = { clinicId, deletedAt: null };
 
    // 1. Basic counts
    const totalPatients = await Patient.countDocuments(clinicFilter);
    const totalAppointments = await Appointment.countDocuments(clinicFilter);
    const totalTreatments = await Treatment.countDocuments(clinicFilter);
    const totalPendingAppointments = await Appointment.countDocuments({
      ...clinicFilter,
      status: { $in: ["requested", "pending"] } as any,
    });
 
    // 2. Today's Appointments & Schedule
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
 
    const utcTodayStart = new Date(new Date().toISOString().split("T")[0]);
    const utcTodayEnd = new Date(utcTodayStart);
    utcTodayEnd.setHours(23, 59, 59, 999);
 
    const todayAppointmentsQuery = {
      ...clinicFilter,
      $or: [
        {
          appointmentDate: {
            $gte: startOfToday,
            $lte: endOfToday,
          },
        },
        {
          appointmentDate: {
            $gte: utcTodayStart,
            $lte: utcTodayEnd,
          },
        },
      ],
    };
 
    const todayAppointmentsCount = await Appointment.countDocuments(todayAppointmentsQuery);
    
    const todayAppointmentsList = await Appointment.find(todayAppointmentsQuery)
      .populate("patientId")
      .sort({ appointmentTime: 1 });
 
    const todaySchedule = todayAppointmentsList.map((app: any) => ({
      _id: app._id,
      patientId: app.patientId?._id || "",
      patientName: app.patientId?.fullName || app.fullName || "Standalone Patient",
      time: app.appointmentTime,
      service: app.service,
      status: app.status,
    }));
 
    // 3. Treatment aggregations (Revenue, Collected, Outstanding, Top Patients, Monthly Revenue)
    const treatments = await Treatment.find(clinicFilter).populate("patientId");
 
    let totalRevenue = 0;
    let totalCollected = 0;
    let revenueToday = 0;
    const startOfTodayMs = startOfToday.getTime();
    const endOfTodayMs = endOfToday.getTime();
 
    const patientRevenueMap: Record<string, { patientName: string; patientCode: string; revenue: number; phone: string; _id: string }> = {};
    const outstandingMap: Record<string, { patientName: string; patientCode: string; due: number; phone: string; _id: string }> = {};
 
    treatments.forEach((t: any) => {
      const cost = t.cost || 0;
      const paid = t.paidAmount || 0;
      totalRevenue += cost;
      totalCollected += paid;
 
      // Calculate revenue generated today
      if (t.createdAt) {
        const createdMs = new Date(t.createdAt).getTime();
        if (createdMs >= startOfTodayMs && createdMs <= endOfTodayMs) {
          revenueToday += cost;
        }
      }
 
      if (t.patientId) {
        const pId = String(t.patientId._id);
        const due = Math.max(0, cost - paid);
 
        // Group revenue by patient
        if (patientRevenueMap[pId]) {
          patientRevenueMap[pId].revenue += cost;
        } else {
          patientRevenueMap[pId] = {
            _id: pId,
            patientName: t.patientId.fullName,
            patientCode: t.patientId.patientCode,
            revenue: cost,
            phone: t.patientId.phone,
          };
        }
 
        // Group outstanding by patient
        if (due > 0) {
          if (outstandingMap[pId]) {
            outstandingMap[pId].due += due;
          } else {
            outstandingMap[pId] = {
              _id: pId,
              patientName: t.patientId.fullName,
              patientCode: t.patientId.patientCode,
              due,
              phone: t.patientId.phone,
            };
          }
        }
      }
    });
 
    const outstandingRevenue = Math.max(0, totalRevenue - totalCollected);
 
    const topRevenuePatients = Object.values(patientRevenueMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
 
    const outstandingPayments = Object.values(outstandingMap)
      .sort((a, b) => b.due - a.due)
      .slice(0, 5);
 
    // 4. Appointment Status Distribution
    const appointments = await Appointment.find(clinicFilter)
      .populate("patientId")
      .sort({ createdAt: -1 });
 
    const statusCounts: Record<string, number> = {
      requested: 0,
      confirmed: 0,
      arrived: 0,
      in_treatment: 0,
      completed: 0,
      no_show: 0,
      cancelled: 0,
    };
    appointments.forEach((a) => {
      const status = (a.status as string) === "pending" ? "requested" : (a.status || "requested");
      if (status in statusCounts) {
        statusCounts[status]++;
      }
    });
 
    const getStatusColor = (status: string) => {
      switch (status) {
        case "requested": return "#f59e0b"; // amber
        case "confirmed": return "#3b82f6"; // blue
        case "arrived": return "#8b5cf6"; // purple
        case "in_treatment": return "#a855f7"; // violet
        case "completed": return "#10b981"; // emerald
        case "no_show": return "#64748b"; // slate
        case "cancelled": return "#ef4444"; // rose
        default: return "#94a3b8";
      }
    };

    const appointmentStatusDist = Object.keys(statusCounts).map((status) => ({
      name: status.replace("_", " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      value: statusCounts[status],
      color: getStatusColor(status),
    })).filter(item => item.value > 0);
 
    // 5. Treatments By Type
    const treatmentCounts: Record<string, number> = {};
    treatments.forEach((t) => {
      const name = t.treatmentName || "Other Procedure";
      treatmentCounts[name] = (treatmentCounts[name] || 0) + 1;
    });
    const treatmentsByType = Object.keys(treatmentCounts)
      .map((name) => ({
        name,
        value: treatmentCounts[name],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
 
    // 6. Revenue By Month (last 6 months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueByMonthMap: Record<string, number> = {};
    const last6Months: string[] = [];
 
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      revenueByMonthMap[key] = 0;
      last6Months.push(key);
    }
 
    treatments.forEach((t) => {
      if (t.createdAt) {
        const date = new Date(t.createdAt);
        const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        if (key in revenueByMonthMap) {
          revenueByMonthMap[key] += t.cost || 0;
        }
      }
    });
 
    const revenueByMonth = last6Months.map((key) => ({
      name: key,
      Revenue: revenueByMonthMap[key],
    }));
 
    // Fetch recent activity feed
    const { AuditLog } = await import("../../../../models/AuditLog");
    const recentActivity = await AuditLog.find({ clinicId })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        totalPatients,
        totalAppointments,
        totalTreatments,
        totalRevenue,
        totalCollected,
        outstandingRevenue,
        todayAppointments: todayAppointmentsCount,
        revenueToday,
        totalPendingAppointments,
        revenueByMonth,
        treatmentsByType,
        appointmentStatus: appointmentStatusDist,
        recentAppointments: appointments.slice(0, 5),
        outstandingPayments,
        topRevenuePatients,
        todaySchedule,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("GET dashboard aggregation error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
