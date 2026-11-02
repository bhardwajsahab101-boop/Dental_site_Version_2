"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface FaqSectionProps {
  content?: any;
}

export default function FaqSection({ content }: FaqSectionProps) {
  const faqs = content?.faqs && content.faqs.length > 0
    ? content.faqs
    : [
        {
          question: "How do I request an appointment at Anil Sharma Dental Hospital?",
          answer:
            "You can submit an online request using our appointment form, or call/WhatsApp our clinic reception directly. Our team will verify schedule availability and contact you promptly to confirm your appointment time.",
        },
        {
          question: "Is root canal treatment (RCT) painful?",
          answer:
            "Modern root canal therapy is performed with local anesthesia, making the procedure virtually pain-free. Its primary goal is to relieve severe dental pain caused by infected pulp and preserve your natural tooth.",
        },
        {
          question: "How often should I have a dental cleaning and checkup?",
          answer:
            "Dental associations recommend a routine checkup and professional ultrasonic scaling every 6 months to prevent plaque buildup, cavities, and gum diseases before they become severe.",
        },
        {
          question: "What safety and hygiene protocols are followed at the clinic?",
          answer:
            "We adhere strictly to hospital-grade infection control, utilizing ultrasonic instrument baths, Class-B autoclave sterilization, single-use barrier pouches, and sanitized treatment operatories for every patient.",
        },
        {
          question: "Can I walk in without an appointment?",
          answer:
            "While emergency cases are accommodated promptly, scheduling in advance helps minimize waiting times and ensures the doctor has dedicated focus for your procedure.",
        },
        {
          question: "What should I do if I experience sudden, acute toothache?",
          answer:
            "Rinse gently with warm water, avoid placing hot or cold substances directly against the tooth, do not place aspirin on the gum, and call our reception immediately to arrange an urgent evaluation.",
        },
      ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faqs" className="py-16 sm:py-24 bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#16A6A1] bg-[#E6F7F6] px-3 py-1 rounded-full">
            Patient Information
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#102C46]">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-[#64748B]">
            Find answers to common questions regarding dental procedures, consultation preparation, and clinic visits.
          </p>
        </div>

        {/* Accordion list */}
        <div className="space-y-3.5">
          {faqs.map((faq: any, idx: number) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-[#102C46] flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-[#16A6A1] shrink-0" />
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#16A6A1]" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#64748B] leading-relaxed border-t border-slate-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact fallback */}
        <div className="mt-10 text-center">
          <p className="text-xs text-[#64748B]">
            Have a question not addressed here?{" "}
            <Link
              href="/contact"
              className="text-[#102C46] font-bold underline hover:text-[#16A6A1] transition inline-flex items-center gap-1 ml-1"
            >
              <span>Contact our clinic team</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
