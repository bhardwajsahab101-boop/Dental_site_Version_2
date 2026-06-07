"use client";

import Link from "next/link";
import { FadeUp } from "../components/ui/motion";

export default function Hero({ clinic }: { clinic?: any }) {
  const clinicName = clinic?.clinicName || clinic?.name || "Trusted Dental Clinic";
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[#f4fbff] py-14 sm:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/60 via-white to-white"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-24 h-72 w-72 rounded-full bg-cyan-100/60 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-12 px-6 lg:flex-row">
        {/* LEFT: headline -> description -> CTAs -> compact stats row */}
        <FadeUp className="w-full flex-1 lg:order-1">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">
            {clinicName}
          </p>

          <h1 className="mb-5 text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
            Modern Dental Care
            <br />
            For Your Family
          </h1>

          <p className="mb-7 max-w-xl text-base leading-relaxed text-gray-600 md:text-lg">
            We provide high-quality dental treatments with modern
            technology and experienced dentists in a comfortable
            environment.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/Booking"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
            >
              Book Appointment
            </Link>

            <a
              href="#services"
              className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
            >
              Learn More
            </a>
          </div>

          <div className="mt-6 grid gap-3 sm:mt-7 sm:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 bg-white/70 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">5000+</p>
              <p className="text-sm text-gray-600">Happy Patients</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white/70 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">15+</p>
              <p className="text-sm text-gray-600">Years Experience</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white/70 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">4.9★</p>
              <p className="text-sm text-gray-600">Google Rating</p>
            </div>
          </div>
        </FadeUp>

        {/* RIGHT: large premium hero image */}
        <FadeUp className="w-full lg:flex-1 lg:order-2" delayMs={120}>
          <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-blue-50/70 via-transparent to-white"
            />
            <img
              loading="lazy"
              src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=1200&auto=format&fit=crop"
              alt="Dental Clinic"
              className="relative h-[320px] w-full object-cover sm:h-[420px] lg:h-[500px]"
            />
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

