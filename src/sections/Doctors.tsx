"use client";

import { clinicData } from "../data/clinicData";
import Card from "../components/ui/card";
import { FadeUp } from "../components/ui/motion";
import SectionHeading from "../components/ui/section-heading";

export default function Doctors({ clinic }: { clinic?: any }) {
  return (
    <section id="doctors" className="bg-[#f8fbff] py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Our Doctors"
          title="Meet Our Experienced Dentists"
          description="Our professional dental team is dedicated to providing safe, modern, and comfortable treatments."
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {clinicData.doctors.map((doctor, index) => (
            <FadeUp key={index} delayMs={index * 70}>
              <Card className="overflow-hidden p-0">
                <div className="relative">
                  <img
                    loading="lazy"
                    src={doctor.image}
                    alt={doctor.name}
                    className="h-64 w-full object-cover sm:h-80"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-transparent"
                  />
                </div>

                <div className="p-6">
                  <h3 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900">
                    {doctor.name}
                  </h3>

                  <p className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[13px] font-medium text-blue-700 ring-1 ring-blue-100 sm:text-sm">
                    {doctor.role}
                  </p>
                </div>
              </Card>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

