import Link from "next/link";
import { getClinic } from "../../lib/clinic";

export const dynamic = "force-dynamic";

export default async function BookingSuccessPage() {
  const clinic = await getClinic();

  return (
    <section className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-6">

      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-gray-100">

        {/* SUCCESS ICON */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">
            ✅
          </span>
        </div>

        {/* TITLE */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Appointment Request Sent
        </h1>

        {/* DESCRIPTION */}
        <p className="text-gray-600 text-lg leading-relaxed mb-8">
          Thank you for choosing{" "}
          <span className="font-semibold text-blue-600">
            {clinic.clinicName}
          </span>
          .
          <br />
          Our clinic team will contact you shortly
          to confirm your appointment.
        </p>

        {/* INFO CARDS */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">

          <div className="bg-blue-50 rounded-2xl p-5">
            <p className="text-sm text-gray-500 mb-1">
              Clinic Hours
            </p>

            <p className="font-semibold text-gray-900">
              Mon - Sat : 9AM - 8PM
            </p>
          </div>

          <div className="bg-blue-50 rounded-2xl p-5">
            <p className="text-sm text-gray-500 mb-1">
              Contact Number
            </p>

            <p className="font-semibold text-gray-900">
              {clinic.phone}
            </p>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">

          <Link
            href="/"
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Back To Home
          </Link>

          <Link
            href="/Booking"
            className="border border-gray-300 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition"
          >
            Book Another Appointment
          </Link>
        </div>
      </div>
    </section>
  );
}