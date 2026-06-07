import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { Treatment } from "../../../../models/treatment";
import { Patient } from "../../../../models/Patient";
import { getCurrentClinic } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const clinicId = await getCurrentClinic();
    if (!clinicId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await connectDB();

    const clinicFilter = { clinicId, deletedAt: null };

    // Fetch all active treatments in this clinic
    const treatments = await Treatment.find(clinicFilter).populate("patientId");

    // Establish date thresholds for today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const startOfTodayMs = startOfToday.getTime();
    const endOfTodayMs = endOfToday.getTime();

    // Establish date thresholds for this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0); // last day of current month
    endOfMonth.setHours(23, 59, 59, 999);

    const startOfMonthMs = startOfMonth.getTime();
    const endOfMonthMs = endOfMonth.getTime();

    let revenueTodayBilled = 0;
    let revenueTodayCollected = 0;
    let revenueMonthBilled = 0;
    let revenueMonthCollected = 0;
    let totalOutstanding = 0;

    const procedureRevenueMap: Record<string, { name: string; revenue: number; count: number }> = {};
    const patientOutstandingMap: Record<
      string,
      { _id: string; patientName: string; patientCode: string; phone: string; due: number }
    > = {};

    treatments.forEach((t: any) => {
      const cost = t.cost || 0;
      const paid = t.paidAmount || 0;
      const due = Math.max(0, cost - paid);

      const createdTime = t.createdAt ? new Date(t.createdAt).getTime() : 0;
      const updatedTime = t.updatedAt ? new Date(t.updatedAt).getTime() : 0;

      // Today's aggregations
      if (createdTime >= startOfTodayMs && createdTime <= endOfTodayMs) {
        revenueTodayBilled += cost;
      }
      if (updatedTime >= startOfTodayMs && updatedTime <= endOfTodayMs && paid > 0) {
        revenueTodayCollected += paid;
      }

      // This Month's aggregations
      if (createdTime >= startOfMonthMs && createdTime <= endOfMonthMs) {
        revenueMonthBilled += cost;
      }
      if (updatedTime >= startOfMonthMs && updatedTime <= endOfMonthMs && paid > 0) {
        revenueMonthCollected += paid;
      }

      // Total outstanding dues
      totalOutstanding += due;

      // Group by procedure
      const procName = t.treatmentName || "Other Procedure";
      if (procedureRevenueMap[procName]) {
        procedureRevenueMap[procName].revenue += cost;
        procedureRevenueMap[procName].count += 1;
      } else {
        procedureRevenueMap[procName] = {
          name: procName,
          revenue: cost,
          count: 1,
        };
      }

      // Group outstanding dues by patient
      if (due > 0 && t.patientId) {
        const pId = String(t.patientId._id);
        if (patientOutstandingMap[pId]) {
          patientOutstandingMap[pId].due += due;
        } else {
          patientOutstandingMap[pId] = {
            _id: pId,
            patientName: t.patientId.fullName,
            patientCode: t.patientId.patientCode,
            phone: t.patientId.phone,
            due,
          };
        }
      }
    });

    const topProcedures = Object.values(procedureRevenueMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const debtorsList = Object.values(patientOutstandingMap)
      .sort((a, b) => b.due - a.due);

    return NextResponse.json({
      success: true,
      data: {
        today: {
          billed: revenueTodayBilled,
          collected: revenueTodayCollected,
        },
        month: {
          billed: revenueMonthBilled,
          collected: revenueMonthCollected,
        },
        outstanding: totalOutstanding,
        topProcedures,
        debtors: debtorsList,
      },
    });
  } catch (error) {
    console.error("GET finance analytics error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load financial statistics" },
      { status: 500 }
    );
  }
}
