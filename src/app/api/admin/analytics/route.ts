import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { Treatment } from "../../../../models/treatment";
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
 
    const treatments = await Treatment.find(clinicFilter).populate("patientId");
 
    let totalRevenue = 0;
    let totalCollected = 0;
 
    const patientRevenueMap: Record<string, { patientName: string; patientCode: string; revenue: number; phone: string; _id: string }> = {};
    const procedureMap: Record<string, { name: string; count: number; revenue: number }> = {};
 
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyDataMap: Record<string, { name: string; revenue: number; collected: number; year: number; monthIdx: number }> = {};
 
    // Initialize last 6 months
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyDataMap[key] = {
        name: key,
        revenue: 0,
        collected: 0,
        year: d.getFullYear(),
        monthIdx: d.getMonth(),
      };
      last6Months.push(key);
    }
 
    treatments.forEach((t: any) => {
      const cost = t.cost || 0;
      const paid = t.paidAmount || 0;
      totalRevenue += cost;
      totalCollected += paid;
 
      // Group by patient
      if (t.patientId) {
        const pId = String(t.patientId._id);
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
      }
 
      // Group by procedure
      const procName = t.treatmentName || "Other Procedure";
      if (procedureMap[procName]) {
        procedureMap[procName].count += 1;
        procedureMap[procName].revenue += cost;
      } else {
        procedureMap[procName] = {
          name: procName,
          count: 1,
          revenue: cost,
        };
      }
 
      // Group by month
      if (t.createdAt) {
        const date = new Date(t.createdAt);
        const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        if (key in monthlyDataMap) {
          monthlyDataMap[key].revenue += cost;
          monthlyDataMap[key].collected += paid;
        }
      }
    });
 
    const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;
 
    // Highest Revenue Patients
    const highestRevenuePatients = Object.values(patientRevenueMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
 
    // Most Common Procedures
    const commonProcedures = Object.values(procedureMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
 
    // Monthly revenue and growth rate
    const monthlyBreakdown = last6Months.map((key, idx) => {
      const monthData = monthlyDataMap[key];
      const prevKey = idx > 0 ? last6Months[idx - 1] : null;
      const prevRevenue = prevKey ? monthlyDataMap[prevKey].revenue : 0;
 
      let growthRate = 0;
      if (prevRevenue > 0) {
        growthRate = Math.round(((monthData.revenue - prevRevenue) / prevRevenue) * 100);
      }
 
      const rate = monthData.revenue > 0 ? Math.round((monthData.collected / monthData.revenue) * 100) : 0;
 
      return {
        name: monthData.name,
        revenue: monthData.revenue,
        collected: monthData.collected,
        collectionRate: rate,
        growthRate,
      };
    });
 
    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalCollected,
        collectionRate,
        highestRevenuePatients,
        commonProcedures,
        monthlyBreakdown,
      },
    });
  } catch (error) {
    console.error("GET analytics error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
