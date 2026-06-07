"use client";

import { clinicData } from "../data/clinicData";
import { FadeUp } from "../components/ui/motion";
import SectionHeading from "../components/ui/section-heading";
import Card from "../components/ui/card";

export default function Services({ clinic }: { clinic?: any }) {
  return (
    <section id="services" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Our Services"
          title="Complete Dental Care Solutions"
          description="We provide a wide range of modern dental treatments to keep your smile healthy and confident."
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {clinicData.services.map((service, index) => (
            <FadeUp key={index} delayMs={index * 70}>
              <Card className="bg-[#f8fbff]">
                <div className="flex h-full flex-col p-8">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-white text-2xl ring-1 ring-blue-100">
                    {service.icon}
                  </div>

                  <h3 className="mb-3 text-xl font-semibold tracking-tight text-gray-900">
                    {service.title}
                  </h3>

                  <p className="mt-auto text-[15px] leading-relaxed text-gray-600 sm:text-[16px]">
                    {service.description}
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

