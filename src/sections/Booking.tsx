"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";



type FormElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

const inputStyles =
  "w-full border border-gray-200 p-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition";

export default function Booking() {
  const [formData, setFormData] = useState({
    // Patient fields
    fullName: "",
    phone: "",
    email: "",
    age: "",
    gender: "",
    address: "",
    medicalNotes: "",

    // Appointment fields
    service: "",
    appointmentDate: "",
    appointmentTime: "",
  });

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<FormElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };



  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    // Basic Validation
    if (formData.phone.length < 10) {
      toast.error("Please enter valid phone number");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/appointments",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      // Check API response
      if (!response.ok) {
        throw new Error(
          data.message ||
          "Something went wrong"
        );
      }


      router.push("/booking-success");

      // Reset form
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        age: "",
        gender: "",
        address: "",
        medicalNotes: "",
        service: "",
        appointmentDate: "",
        appointmentTime: "",
      });
    } catch (error) {
      console.log(error);

      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-20 px-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">

        {/* LEFT SIDE */}
        <div>
          <p className="text-blue-600 font-semibold uppercase tracking-wider mb-3">
            Book Appointment
          </p>

          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
            Schedule Your Dental Visit
          </h1>

          <p className="text-gray-600 text-lg mb-8">
            Our experienced dental team is ready
            to provide comfortable and modern
            dental care for you and your family.
          </p>

          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              ✅ 5000+ Happy Patients
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              🕒 Mon - Sat : 9AM - 8PM
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              ⭐ Rated 4.9 By Patients
            </div>
          </div>
        </div>

        {/* RIGHT SIDE FORM */}
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">

          <h2 className="text-3xl font-bold mb-8 text-gray-900">
            Book Appointment
          </h2>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              required
              className={inputStyles}
            />

            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
              className={inputStyles}
            />

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              className={inputStyles}
            />

            {/* SERVICE DROPDOWN */}
            <select
              name="service"
              value={formData.service}
              onChange={handleChange}
              required
              className={inputStyles}
            >
              <option value="">
                Select Service
              </option>

              <option value="Dental Cleaning">
                Dental Cleaning
              </option>

              <option value="Root Canal">
                Root Canal
              </option>

              <option value="Teeth Whitening">
                Teeth Whitening
              </option>

              <option value="Dental Implants">
                Dental Implants
              </option>
            </select>

            <input
              type="date"
              name="appointmentDate"
              value={formData.appointmentDate}
              onChange={handleChange}
              required
              min={
                new Date()
                  .toISOString()
                  .split("T")[0]
              }
              className={inputStyles}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="number"
                name="age"
                placeholder="Age"
                value={formData.age}
                onChange={handleChange}
                min={0}
                className={inputStyles}
              />

              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={inputStyles}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              className={inputStyles}
            />

            <textarea
              name="medicalNotes"
              placeholder="Medical Notes (conditions, meds, etc.)"
              value={formData.medicalNotes}
              onChange={handleChange}
              rows={4}
              className={inputStyles}
            />

            <input
              type="time"
              name="appointmentTime"
              value={formData.appointmentTime}
              onChange={handleChange}
              required
              className={inputStyles}
            />

            <button
              type="submit"
              disabled={loading}
              className={`
                w-full
                bg-blue-600
                text-white
                py-4
                rounded-xl
                font-semibold
                transition
                shadow-lg
                ${loading
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-blue-700"
                }
              `}
            >
              {loading
                ? "Booking..."
                : "Book Appointment"}

            </button>
          </form>
        </div>
      </div>
    </section>
  );
}