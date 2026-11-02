"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Save,
  Globe,
  FileText,
  User,
  Clock,
  HelpCircle,
  Search,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export default function WebsiteContentCMSPage() {
  const [activeTab, setActiveTab] = useState<
    "hero" | "about" | "doctor" | "hours" | "faqs" | "seo"
  >("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [hero, setHero] = useState<any>({
    badge: "",
    headline: "",
    subheadline: "",
    ctaPrimaryText: "",
    ctaSecondaryText: "",
    noticeBadge: "",
  });

  const [about, setAbout] = useState<any>({
    tagline: "",
    title: "",
    description: "",
    highlights: [],
    sterilizationProtocol: "",
  });

  const [doctor, setDoctor] = useState<any>({
    name: "",
    title: "",
    qualificationPlaceholder: "",
    registrationPlaceholder: "",
    experiencePlaceholder: "",
    bio: "",
    specialties: [],
  });

  const [hours, setHours] = useState<any>({
    morning: "",
    evening: "",
    sunday: "",
    notes: "",
  });

  const [faqs, setFaqs] = useState<any[]>([]);
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");

  const [seo, setSeo] = useState<any>({
    metaTitle: "",
    metaDescription: "",
    keywords: "",
  });

  useEffect(() => {
    fetchContent();
  }, []);

  async function fetchContent() {
    try {
      const res = await fetch("/api/admin/content");
      const data = await res.json();
      if (data.success && data.content) {
        const c = data.content;
        if (c.hero) setHero(c.hero);
        if (c.about) setAbout(c.about);
        if (c.doctor) setDoctor(c.doctor);
        if (c.hours) setHours(c.hours);
        if (c.faqs) setFaqs(c.faqs);
        if (c.seo) setSeo(c.seo);
      }
    } catch (err) {
      console.error("Failed to load CMS content:", err);
      toast.error("Error loading website content");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hero,
          about,
          doctor,
          hours,
          faqs,
          seo,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Website content saved and published!");
      } else {
        throw new Error(data.message || "Failed to save content");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error saving content");
    } finally {
      setSaving(false);
    }
  }

  const addFaqItem = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) {
      toast.error("Both question and answer are required");
      return;
    }
    setFaqs([...faqs, { question: newFaqQ.trim(), answer: newFaqA.trim() }]);
    setNewFaqQ("");
    setNewFaqA("");
    toast.success("FAQ added to list (click Save Changes to publish)");
  };

  const removeFaqItem = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#16A6A1]" />
        <p className="text-xs text-slate-500 font-semibold">Loading CMS content...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#102C46] text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#16A6A1] bg-white/10 px-3 py-1 rounded-full">
            Content Management System
          </span>
          <h1 className="text-xl font-black mt-2 tracking-tight">
            Website Content & Copy Editor
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Edit live texts for Homepage, Doctor Profile, Consultation Hours, FAQs, and SEO metadata.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/15 transition"
          >
            <span>View Public Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { key: "hero", label: "Homepage Hero", icon: Globe },
          { key: "about", label: "About & Principles", icon: FileText },
          { key: "doctor", label: "Doctor Profile", icon: User },
          { key: "hours", label: "Operating Hours", icon: Clock },
          { key: "faqs", label: "Patient FAQs", icon: HelpCircle },
          { key: "seo", label: "SEO & Search Tags", icon: Search },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition ${
                isActive
                  ? "bg-[#102C46] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Icon className="w-4 h-4 text-[#16A6A1]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Container */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* TAB 1: HERO */}
        {activeTab === "hero" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-[#102C46] border-b border-slate-100 pb-3">
              Hero Section Settings
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Top Hero Badge
              </label>
              <input
                type="text"
                value={hero.badge}
                onChange={(e) => setHero({ ...hero, badge: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Main Headline
              </label>
              <input
                type="text"
                value={hero.headline}
                onChange={(e) => setHero({ ...hero, headline: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Sub-Headline Description
              </label>
              <textarea
                rows={3}
                value={hero.subheadline}
                onChange={(e) => setHero({ ...hero, subheadline: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#102C46] mb-1">
                  Primary CTA Text
                </label>
                <input
                  type="text"
                  value={hero.ctaPrimaryText}
                  onChange={(e) => setHero({ ...hero, ctaPrimaryText: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102C46] mb-1">
                  Secondary CTA Text
                </label>
                <input
                  type="text"
                  value={hero.ctaSecondaryText}
                  onChange={(e) => setHero({ ...hero, ctaSecondaryText: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Notice Badge (Appointments notice)
              </label>
              <input
                type="text"
                value={hero.noticeBadge}
                onChange={(e) => setHero({ ...hero, noticeBadge: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              />
            </div>
          </div>
        )}

        {/* TAB 2: ABOUT */}
        {activeTab === "about" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-[#102C46] border-b border-slate-100 pb-3">
              About Clinic & Philosophy
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Section Tagline
              </label>
              <input
                type="text"
                value={about.tagline}
                onChange={(e) => setAbout({ ...about, tagline: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Section Title
              </label>
              <input
                type="text"
                value={about.title}
                onChange={(e) => setAbout({ ...about, title: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Full Clinic Story / Introduction
              </label>
              <textarea
                rows={5}
                value={about.description}
                onChange={(e) => setAbout({ ...about, description: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Sterilization & Safety Description
              </label>
              <textarea
                rows={3}
                value={about.sterilizationProtocol}
                onChange={(e) => setAbout({ ...about, sterilizationProtocol: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              />
            </div>
          </div>
        )}

        {/* TAB 3: DOCTOR PROFILE */}
        {activeTab === "doctor" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-[#102C46] border-b border-slate-100 pb-3">
              Dentist Profile Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#102C46] mb-1">
                  Doctor Name
                </label>
                <input
                  type="text"
                  value={doctor.name}
                  onChange={(e) => setDoctor({ ...doctor, name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102C46] mb-1">
                  Professional Title / Role
                </label>
                <input
                  type="text"
                  value={doctor.title}
                  onChange={(e) => setDoctor({ ...doctor, title: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#102C46] mb-1">
                  Qualifications (Placeholder on record)
                </label>
                <input
                  type="text"
                  value={doctor.qualificationPlaceholder}
                  onChange={(e) => setDoctor({ ...doctor, qualificationPlaceholder: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102C46] mb-1">
                  Dental Council Registration Note
                </label>
                <input
                  type="text"
                  value={doctor.registrationPlaceholder}
                  onChange={(e) => setDoctor({ ...doctor, registrationPlaceholder: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Doctor Biography & Approach
              </label>
              <textarea
                rows={4}
                value={doctor.bio}
                onChange={(e) => setDoctor({ ...doctor, bio: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              />
            </div>
          </div>
        )}

        {/* TAB 4: HOURS */}
        {activeTab === "hours" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-[#102C46] border-b border-slate-100 pb-3">
              Consultation Hours & Schedule
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Morning Shift
              </label>
              <input
                type="text"
                value={hours.morning}
                onChange={(e) => setHours({ ...hours, morning: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Evening Shift
              </label>
              <input
                type="text"
                value={hours.evening}
                onChange={(e) => setHours({ ...hours, evening: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Sunday Policy
              </label>
              <input
                type="text"
                value={hours.sunday}
                onChange={(e) => setHours({ ...hours, sunday: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Emergency & Walk-in Notes
              </label>
              <input
                type="text"
                value={hours.notes}
                onChange={(e) => setHours({ ...hours, notes: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              />
            </div>
          </div>
        )}

        {/* TAB 5: FAQS */}
        {activeTab === "faqs" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-[#102C46] border-b border-slate-100 pb-3">
              Patient Frequently Asked Questions
            </h3>

            {/* List existing FAQs */}
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-[#102C46]">{faq.question}</p>
                    <p className="text-[#64748B] leading-relaxed">{faq.answer}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFaqItem(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                    title="Delete FAQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New FAQ box */}
            <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 bg-white space-y-3">
              <h4 className="text-xs font-bold text-[#102C46] uppercase tracking-wider">
                Add New Question & Answer
              </h4>
              <div>
                <input
                  type="text"
                  placeholder="Question (e.g. How do I prepare for my extraction?)"
                  value={newFaqQ}
                  onChange={(e) => setNewFaqQ(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
                />
              </div>
              <div>
                <textarea
                  rows={2}
                  placeholder="Answer..."
                  value={newFaqA}
                  onChange={(e) => setNewFaqA(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
                />
              </div>
              <button
                type="button"
                onClick={addFaqItem}
                className="inline-flex items-center gap-1.5 bg-[#102C46] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#1A3E61] transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add FAQ to List</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: SEO */}
        {activeTab === "seo" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-[#102C46] border-b border-slate-100 pb-3">
              SEO & Search Meta Configuration
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Meta Title
              </label>
              <input
                type="text"
                value={seo.metaTitle}
                onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Meta Description
              </label>
              <textarea
                rows={3}
                value={seo.metaDescription}
                onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Search Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={seo.keywords}
                onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              />
            </div>
          </div>
        )}

        {/* Save Bar */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Changes will take effect immediately across all public clinic pages.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#16A6A1] hover:bg-[#128884] text-white text-xs font-bold px-6 py-3 rounded-xl shadow-sm transition disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Publish Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
