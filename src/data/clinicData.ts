import { clinic } from "./config/clinic";
import { branding } from "./config/branding";
import { contact } from "./config/contact";
import { timings } from "./config/timings";
import { seo } from "./config/seo";
import { navigation } from "./config/navigation";
import { hero } from "./config/hero";
import { services } from "./config/services";
import { doctors } from "./config/doctors";
import { testimonials } from "./config/testimonials";
import { booking } from "./config/booking";
import { footer } from "./config/footer";

export const clinicData = {
  // BASIC INFO
  clinicName: clinic.name,

  // SEO
  seo: {
    title: seo.title,
    description: seo.description,
  },

  // CONTACT INFO
  contact: {
    phone: contact.phone,
    email: contact.email,
    address: contact.address,
  },

  // CLINIC TIMINGS
  timings: {
    days: timings.days,
    hours: timings.hours,
  },

  // THEME
  theme: {
    primaryColor: branding.primaryColor,
  },

  // NAVIGATION
  navigation,

  // HERO SECTION
  hero,

  // SERVICES
  services,

  // DOCTORS
  doctors,

  // TESTIMONIALS
  testimonials,

  // BOOKING SERVICES
  bookingServices: booking,

  // FOOTER
  footer,
};