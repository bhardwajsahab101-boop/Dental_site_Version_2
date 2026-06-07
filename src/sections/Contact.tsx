"use client";

import { clinicData } from "../data/clinicData";
import { FadeUp } from "../components/ui/motion";
import Card from "../components/ui/card";
import SectionHeading from "../components/ui/section-heading";

export default function Contact({ clinic }: { clinic?: any }) {
  const phone = clinic?.phone || clinicData.contact.phone;
  const email = clinic?.email || clinicData.contact.email;
  const address = clinic?.address || clinicData.contact.address;

  return (
    <section id="contact" className="bg-[#f8fbff] py-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2">
        <FadeUp>
          <div>
            <SectionHeading
              eyebrow="Contact Us"
              title="Book Your Dental Visit Today"
              description="Our friendly team is ready to help you with appointments, consultations, and any dental questions you may have."
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-1">
              <div className="rounded-2xl border border-blue-100 bg-white/60 p-5">
                <p className="text-sm font-semibold text-gray-900">Phone</p>
                <p className="mt-1 break-words text-[15px] leading-relaxed text-gray-600">
                  {phone}
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white/60 p-5">
                <p className="text-sm font-semibold text-gray-900">Email</p>
                <p className="mt-1 break-words text-[15px] leading-relaxed text-gray-600">
                  {email}
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white/60 p-5">
                <p className="text-sm font-semibold text-gray-900">Address</p>
                <p className="mt-1 text-[15px] leading-relaxed text-gray-600">
                  {address}
                </p>
              </div>
            </div>
          </div>
        </FadeUp>

        <FadeUp className="">
          <Card className="bg-white p-0">
            <div className="p-8">
              <form className="space-y-6">
                <div>
                  <label className="mb-2 block font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Enter your name"
                    autoComplete="name"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium text-gray-700">
                    Message
                  </label>
                  <textarea
                    name="message"
                    rows={5}
                    placeholder="Write your message"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 px-6 py-4 font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                >
                  Send Message
                </button>
              </form>
            </div>
          </Card>
        </FadeUp>
      </div>
    </section>
  );
}

