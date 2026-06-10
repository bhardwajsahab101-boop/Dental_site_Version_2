import Booking from "../../sections/Booking";
import Navbar from "../../components/navbar";
import Footer from "../../sections/Footer";
import { getClinic } from "../../lib/clinic";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const clinic = await getClinic();

  let services: string[] = [];
  try {
    const { connectDB } = await import("../../lib/mongodb");
    const { ClinicService } = await import("../../models/ClinicService");
    await connectDB();
    if (clinic && clinic.id && clinic.id !== "fallback-id") {
      const dbServices = await ClinicService.find({ clinicId: clinic.id, active: true }).sort({ name: 1 }).lean();
      services = dbServices.map((s: any) => s.name);
    }
  } catch (err) {
    console.error("Error loading services for public booking page:", err);
  }

  return (
    <main className="min-h-screen">
      <Navbar clinic={clinic} />
      <Booking clinic={clinic} services={services} />
      <Footer clinic={clinic} />
    </main>
  );
}