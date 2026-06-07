"use client";

import { clinicData } from "../data/clinicData";
import Card from "../components/ui/card";
import { FadeUp } from "../components/ui/motion";
import SectionHeading from "../components/ui/section-heading";

export default function Testimonials({ clinic }: { clinic?: any }) {
  return (
    <section id="testimonials" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Testimonials"
          title="What Our Patients Say"
          description="We are trusted by hundreds of patients for modern, comfortable, and professional dental care."
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {clinicData.testimonials.map((testimonial, index) => (
            <FadeUp key={index} delayMs={index * 70}>
              <Card className="bg-[#f8fbff]">
                <div className="flex h-full flex-col p-8">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="text-yellow-400" aria-label={`${testimonial.rating} out of 5 stars`}>
                      {"★★★★★"}
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-100">
                      Verified Patient
                    </span>
                  </div>

                  <p className="mb-6 flex-1 text-gray-600 leading-relaxed text-[15px] sm:text-[16px]">
                    “{testimonial.review}”
                  </p>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-gray-500">Patient</p>
                  </div>
                </div>
              </Card>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

