"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Send, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export default function ContactFormClient({ clinicId }: { clinicId?: string }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!fullName || fullName.trim().length < 2) {
      setErrorMsg("Please enter your full name (at least 2 characters).");
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please provide a valid email address.");
      return;
    }

    if (!message || message.trim().length < 10) {
      setErrorMsg("Please enter a message of at least 10 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId,
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        toast.success("Enquiry sent successfully!");
        setFullName("");
        setEmail("");
        setPhone("");
        setMessage("");
      } else {
        throw new Error(data.message || "Failed to send message. Please try again.");
      }
    } catch (err: any) {
      console.error("Contact form error:", err);
      setErrorMsg(err.message || "An unexpected error occurred. Please call the clinic directly.");
      toast.error(err.message || "Failed to submit message");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-[#E6F7F6] border border-[#16A6A1]/40 rounded-2xl p-8 text-center space-y-4 animate-in fade-in duration-200">
        <div className="w-12 h-12 rounded-full bg-[#16A6A1] text-white flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-lg font-bold text-[#102C46]">Thank You for Reaching Out</h4>
          <p className="text-xs sm:text-sm text-[#172B3A] max-w-md mx-auto">
            Your message has been safely received by the staff at Anil Sharma Dental Hospital. We will contact you via email or phone shortly.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="text-xs font-bold text-[#16A6A1] hover:underline pt-2"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div>
        <label htmlFor="fullName" className="block text-xs font-bold text-[#102C46] mb-1.5">
          Full Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="fullName"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Ramesh Kumar"
          className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1] transition"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-xs font-bold text-[#102C46] mb-1.5">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. ramesh@example.com"
            className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1] transition"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-xs font-bold text-[#102C46] mb-1.5">
            Phone Number <span className="text-slate-400 font-normal">(Optional for faster reply)</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +91 98765 43210"
            className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1] transition"
          />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-xs font-bold text-[#102C46] mb-1.5">
          Your Enquiry or Message <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your query, treatment interest, or questions..."
          className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1] transition resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 bg-[#16A6A1] hover:bg-[#128884] text-white font-bold text-sm py-3.5 rounded-xl shadow-sm transition active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sending Message...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>Submit Enquiry</span>
          </>
        )}
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        🔒 Your contact information is kept strictly confidential and used solely for addressing your enquiry.
      </p>
    </form>
  );
}
