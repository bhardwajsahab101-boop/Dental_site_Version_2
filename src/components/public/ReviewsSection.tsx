import { Star, ExternalLink, ShieldCheck, MessageSquareHeart } from "lucide-react";

interface ReviewsSectionProps {
  clinic?: any;
}

export default function ReviewsSection({ clinic }: ReviewsSectionProps) {
  const clinicName = clinic?.name || "Anil Sharma Dental Hospital";
  const googleBusinessUrl = clinic?.googleBusinessUrl || clinic?.googleMapsUrl || "https://maps.google.com";

  return (
    <section className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#16A6A1] bg-[#E6F7F6] px-3 py-1 rounded-full">
            Patient Feedback & Transparency
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#102C46]">
            Real Patient Experiences
          </h2>
          <p className="text-sm sm:text-base text-[#64748B]">
            We uphold strict medical integrity: we never display fabricated ratings or automated bot testimonials. Genuine reviews reflect real clinical care and direct patient trust.
          </p>
        </div>

        {/* Informational Callout & Google Business Connection */}
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-3xl p-8 sm:p-10 max-w-4xl mx-auto text-center space-y-6 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#E6F7F6] text-[#16A6A1] flex items-center justify-center mx-auto">
            <MessageSquareHeart className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-[#102C46]">
              Share Your Dental Visit Experience
            </h3>
            <p className="text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
              If you have visited {clinicName} for a consultation, root canal treatment, or dental scaling, your feedback helps us continually enhance our patient care.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href={googleBusinessUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#102C46] hover:bg-[#1A3E61] text-white text-sm font-bold px-6 py-3 rounded-xl shadow-sm transition"
            >
              <span>View & Write Google Review</span>
              <ExternalLink className="w-4 h-4 text-[#16A6A1]" />
            </a>
          </div>

          <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-6 text-xs text-[#64748B]">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#16A6A1]" />
              <span>Verified Google Maps Listing</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Authentic Patient Ratings Only</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
