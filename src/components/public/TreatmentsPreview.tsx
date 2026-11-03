import Link from "next/link";
import { TREATMENTS } from "../../data/treatmentsData";
import { ArrowRight, Clock, ShieldCheck, Calendar, Activity, Sparkles, Award, Stethoscope, Sun } from "lucide-react";

export default function TreatmentsPreview() {
  // Show featured treatments on homepage
  const featuredTreatments = TREATMENTS.filter((t) => t.featured).slice(0, 6);

  // Helper to render clinical icons
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "Stethoscope":
        return <Stethoscope className="w-6 h-6 text-[#16A6A1]" />;
      case "Sparkles":
        return <Sparkles className="w-6 h-6 text-[#16A6A1]" />;
      case "ShieldCheck":
        return <ShieldCheck className="w-6 h-6 text-[#16A6A1]" />;
      case "Activity":
        return <Activity className="w-6 h-6 text-[#16A6A1]" />;
      case "Award":
        return <Award className="w-6 h-6 text-[#16A6A1]" />;
      case "Sun":
        return <Sun className="w-6 h-6 text-[#16A6A1]" />;
      default:
        return <ShieldCheck className="w-6 h-6 text-[#16A6A1]" />;
    }
  };

  return (
    <section id="treatments" className="py-16 sm:py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#16A6A1] bg-[#E6F7F6] px-3 py-1 rounded-full">
              Dental Treatments & Services
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#102C46]">
              Comprehensive Dental Care for Every Family Member
            </h2>
            <p className="text-sm sm:text-base text-[#64748B]">
              From conservative preventive cleanings to advanced root canal therapy and aesthetic tooth restorations, our practice delivers precise clinical treatments tailored to your dental needs.
            </p>
          </div>

          <Link
            href="/treatments"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#102C46] hover:text-[#16A6A1] transition group shrink-0"
          >
            <span>View All 12 Clinical Services</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Treatment Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredTreatments.map((treatment) => (
            <div
              key={treatment.id}
              className="group bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-[#16A6A1] hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[#E6F7F6] flex items-center justify-center group-hover:scale-105 transition-transform">
                    {renderIcon(treatment.iconName)}
                  </div>
                  <span className="text-[11px] font-semibold text-[#16A6A1] bg-[#E6F7F6]/60 px-2.5 py-1 rounded-md">
                    {treatment.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#102C46] group-hover:text-[#16A6A1] transition-colors">
                    {treatment.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-2 line-clamp-3 leading-relaxed">
                    {treatment.shortDescription}
                  </p>
                </div>

                <div className="pt-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Primary Benefits
                  </p>
                  <ul className="space-y-1">
                    {treatment.benefits.slice(0, 2).map((benefit, i) => (
                      <li key={i} className="text-xs text-[#172B3A] flex items-start gap-1.5">
                        <span className="text-[#16A6A1] font-bold">•</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#16A6A1]" />
                  <span>{treatment.duration}</span>
                </div>

                <Link
                  href={`/booking?service=${encodeURIComponent(treatment.title)}`}
                  className="inline-flex items-center gap-1 font-bold text-[#102C46] group-hover:text-[#16A6A1] transition"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Request Appointment</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Directory CTA Strip */}
        <div className="mt-12 p-6 rounded-2xl bg-white border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-[#102C46]">Need a specific treatment not listed above?</h4>
            <p className="text-xs text-[#64748B]">
              Explore our full directory covering pediatric care, complete dentures, gum surgery, and orthodontic evaluations.
            </p>
          </div>
          <Link
            href="/treatments"
            className="inline-flex items-center gap-2 bg-[#102C46] hover:bg-[#1A3E61] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
          >
            <span>Explore Full Treatment Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

