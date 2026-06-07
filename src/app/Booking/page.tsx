import Booking from "../../sections/Booking";
import Navbar from "../../components/navbar";
import Footer from "../../sections/Footer";
import { getClinic } from "../../lib/clinic";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const clinic = await getClinic();

  return (
    <main className="min-h-screen">
      <Navbar clinic={clinic} />
      <Booking clinic={clinic} />
      <Footer clinic={clinic} />
    </main>
  );
}