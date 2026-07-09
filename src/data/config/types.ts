export interface ClinicConfig {
  name: string;
}

export interface BrandingConfig {
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor?: string;
}

export interface ContactConfig {
  phone: string;
  email: string;
  address: string;
  whatsapp?: string;
  googleMaps?: string;
}

export interface TimingsConfig {
  days: string;
  hours: string;
}

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
}

export interface NavigationItem {
  label: string;
  href: string;
}
export type NavigationConfig = NavigationItem[];

export interface StatItem {
  value: string;
  label: string;
}

export interface HeroConfig {
  title: string;
  subtitle: string;
  buttonText: string;
  stats: StatItem[];
}

export interface ServiceItem {
  title: string;
  description: string;
  icon: string;
  duration?: string;
  featured?: boolean;
}
export type ServicesConfig = ServiceItem[];

export interface DoctorItem {
  name: string;
  role: string;
  image: string;
  specialization?: string;
  experience?: string;
  qualification?: string;
}
export type DoctorsConfig = DoctorItem[];

export interface TestimonialItem {
  name: string;
  review: string;
  rating: number;
  treatment?: string;
  image?: string;
}
export type TestimonialsConfig = TestimonialItem[];

export type BookingServicesConfig = string[];

export interface FooterConfig {
  description: string;
  copyright: string;
}
