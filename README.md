# Anil Sharma Dental Hospital — Premium Dental Clinic & Management Platform

A production-grade dental clinic website and management platform for **Anil Sharma Dental Hospital** (signboard: *A.K. Sharma Dental Hospital*), built on Next.js 16, React, Tailwind CSS v4, and MongoDB with a multi-tenant SaaS foundation.

---

## Architecture Overview

1. **Public Dental Clinic Website**
   - **Homepage (`/`)**: Hero with clinical value proposition, trust indicators, treatments preview, Dr. Anil Sharma introduction, facility gallery with interactive lightbox, Google Business reviews section, FAQ accordion, emergency contact banner, and detailed footer.
   - **About Doctor & Clinic (`/about`)**: Clinical philosophy, sterilization & infection-control protocols, Dr. Anil Sharma's qualifications placeholder, and clinic operatory photographs.
   - **Treatments Directory (`/treatments`)**: 12 categorized dental procedures (General Dentistry, Root Canal, Crowns & Bridges, Cleaning & Scaling, Pediatric Care, Orthodontics, etc.) with search, category filtering, clinical indications, and direct booking triggers.
   - **Clinic Gallery (`/gallery`)**: Filterable photo gallery by category (Clinic Exterior, Operatory, Advanced Equipment, Patient Care) with interactive lightbox modal.
   - **Contact & Location (`/contact`)**: Instant-click phone & WhatsApp mobile buttons, physical address, consultation hours, sanitized contact enquiry form, and Google Maps embed placeholder.
   - **Appointment Request (`/booking`)**: Validated public appointment request form (patient name, phone, preferred date/time slot, treatment interest, notes). Displays clear confirmation that requests are reviewed by clinic staff prior to confirmation.
   - **SEO & Discoverability**: Semantic HTML5, Schema.org `Dentist` / `LocalBusiness` JSON-LD structured data, dynamic `sitemap.xml`, and `robots.txt`.

2. **Clinic Admin Management Dashboard (`/admin`)**
   - **Overview Dashboard (`/admin`)**: Real-time KPI summary cards (Total Appointments, Pending Requests, Confirmed Visits, In-Treatment, Completed, and New Enquiries), quick action links, and recent activity feed.
   - **Appointment Management (`/admin/appointments`)**: Filterable appointment triage table by status (`requested`, `confirmed`, `arrived`, `in_treatment`, `completed`, `cancelled`), patient details, and internal clinical notes.
   - **Website CMS (`/admin/content`)**: Visual dynamic editor to update homepage headlines, doctor biography, clinic timings, FAQs, and SEO meta tags without editing code.
   - **Clinic Gallery Manager (`/admin/gallery`)**: Add new clinic photos, update titles, categories, alt text, and toggle featured homepage status.
   - **Patient Enquiries Inbox (`/admin/enquiries` & `/admin/messages`)**: Triage incoming messages submitted via public contact forms with status markers (`unread`, `read`, `replied`) and internal staff notes.
   - **Clinic Configuration (`/admin/settings`)**: Manage clinic name, alternate signboard name, official phone, WhatsApp number, email, address, and Google Business Profile links.

3. **Multi-Tenant SaaS Foundation**
   - Tenant isolation via strict `clinicId` database scoping across all Mongoose models (`Clinic`, `User`, `Patient`, `Appointment`, `ClinicService`, `ContactMessage`, `WebsiteContent`, `GalleryItem`).
   - Role-Based Access Control (RBAC): `superadmin` (cross-clinic SaaS management) and `owner` / `admin` (clinic-scoped management).
   - Subscription-ready data models (`subscriptionPlan`, `subscriptionStatus`, `trialEndsAt`, `isActive`) ready for future billing gateway integration.

---

## Visual Design System

- **Primary Clinical Navy**: `#102C46` — Trust, authority, and calm clinical assurance.
- **Secondary Dental Turquoise / Teal**: `#16A6A1` — Fresh, modern healthcare accent.
- **Warm White / Slate Background**: `#F8FAFC` — Warm and welcoming patient environment.
- **Surface**: `#FFFFFF` with restrained shadows (`shadow-sm`, `shadow-md`) and subtle slate borders.
- **Typography**: Clean, highly readable sans-serif hierarchy (Inter / System sans).

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 18.x or 20.x
- MongoDB 6.x or 7.x running locally on port 27017 or a MongoDB Atlas URI

### 1. Installation
```bash
git clone <repository-url>
cd "Clinic Website"
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the project root (see `.env.example`):
```env
# Database
MONGODB_URI=mongodb://127.0.0.1:27017/dentalos

# Security
JWT_SECRET=production_jwt_secret_sharma_dental_hospital_2026_super_secure

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Default Seed Credentials (auto-seeded on first run)
DEFAULT_ADMIN_EMAIL=admin@sharmadental.com
DEFAULT_ADMIN_PASSWORD=Password123
SUPERADMIN_EMAIL=superadmin@dentalos.com
SUPERADMIN_PASSWORD=Superadmin123
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## Default Admin Credentials

On first connection to MongoDB, the system automatically initializes the database with default records:
- **Clinic**: Anil Sharma Dental Hospital (*A.K. Sharma Dental Hospital*)
- **Admin Portal URL**: `http://localhost:3000/admin/login`
- **Email**: `admin@sharmadental.com`
- **Password**: `Password123`
- **SuperAdmin Account**: `superadmin@dentalos.com` / `Superadmin123`

*(Note: Change these passwords in production via the settings panel).*

---

## Key Routes & Endpoints

| Route | Purpose | Access |
|---|---|---|
| `/` | Public Homepage | Public |
| `/about` | Clinic & Doctor Profile | Public |
| `/treatments` | Treatment Directory (12 Procedures) | Public |
| `/gallery` | Photo Gallery & Lightbox | Public |
| `/contact` | Contact Information & Form | Public |
| `/booking` | Appointment Request Flow | Public |
| `/sitemap.xml` | Dynamic Search Engine Sitemap | Public |
| `/robots.txt` | Crawler Directives | Public |
| `/admin/login` | Secure Staff & Admin Sign In | Public |
| `/admin` | Main Analytics Dashboard | Protected (Admin/Staff) |
| `/admin/appointments` | Appointment Status Workflow | Protected (Admin/Staff) |
| `/admin/content` | Website Content CMS | Protected (Admin) |
| `/admin/gallery` | Gallery Media Management | Protected (Admin) |
| `/admin/enquiries` | Public Enquiries Inbox | Protected (Admin/Staff) |
| `/admin/settings` | Clinic Settings & Social Profiles | Protected (Admin) |

---

## Production Deployment Checklist

### 1. Database
- Deploy a cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
- Update `MONGODB_URI` in production environment variables with SSL enabled (`mongodb+srv://...`).

### 2. Environment Variables
- Generate a cryptographically secure `JWT_SECRET` (e.g. `openssl rand -hex 32`).
- Update `NEXT_PUBLIC_BASE_URL` to your production domain (e.g. `https://sharmadental.com`).

### 3. Required Clinic Information for Launch
- [ ] Official physical clinic address & landmark.
- [ ] Direct phone number & dedicated WhatsApp business number.
- [ ] Dr. Anil Sharma's verified degrees (BDS/MDS), state dental council registration number, and clinical focus areas.
- [ ] Actual consultation hours (weekdays, Saturdays, Sundays).
- [ ] Real high-resolution operatory, reception, and clinic signboard photographs.
- [ ] Verified Google Business Profile URL and Google Maps Place embed link.

### 4. External Services Needed for Full Automation
- **Email Delivery (Transactional)**: SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) or SendGrid/Postmark API keys to email appointment confirmations.
- **SMS / WhatsApp Notifications**: Twilio or WhatsApp Cloud API token to dispatch instant SMS/WhatsApp alerts on appointment status changes.
- **Search Console & Analytics**: Google Search Console verification meta tag and Google Analytics 4 tracking ID (`G-XXXXXXXXXX`).
