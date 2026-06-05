import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { Patient } from "../../../../models/Patient";
import { Appointment } from "../../../../models/Appointment";
import { Treatment } from "../../../../models/treatment";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    // 1. Basic counts
    const totalPatients = await Patient.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const totalTreatments = await Treatment.countDocuments();
    const totalPendingAppointments = await Appointment.countDocuments({ status: "pending" });

    // 2. Today's Appointments & Schedule
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const utcTodayStart = new Date(new Date().toISOString().split("T")[0]);
    const utcTodayEnd = new Date(utcTodayStart);
    utcTodayEnd.setHours(23, 59, 59, 999);

    const todayAppointmentsQuery = {
      $or: [
        {
          appointmentDate: {
            $gte: startOfToday,
            $lte: endOfToday
          }
        },
        {
          appointmentDate: {
            $gte: utcTodayStart,
            $lte: utcTodayEnd
          }
        }
      ]
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
    const treatments = await Treatment.find().populate("patientId");

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
    const appointments = await Appointment.find()
      .populate("patientId")
      .sort({ createdAt: -1 });

    const statusCounts: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };
    appointments.forEach((a) => {
      const status = a.status || "pending";
      if (status in statusCounts) {
        statusCounts[status]++;
      }
    });

    const appointmentStatusDist = Object.keys(statusCounts).map((status) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: statusCounts[status],
      color:
        status === "pending"
          ? "#f59e0b"
          : status === "confirmed"
          ? "#3b82f6"
          : status === "completed"
          ? "#10b981"
          : "#ef4444",
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
