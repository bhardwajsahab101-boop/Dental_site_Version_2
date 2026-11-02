import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI");
}

// Global caching structure for Mongoose
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  seeded: boolean;
}

let cached: MongooseCache = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null, seeded: false };
}

async function seedDefaultClinicAndUser() {
  try {
    const { Clinic } = await import("../models/Clinic");
    const { User } = await import("../models/User");
    const { ClinicSettings } = await import("../models/ClinicSettings");
    const { SaaSSettings, getSaaSSettings } = await import("../models/SaaSSettings");
    const { WebsiteContent } = await import("../models/WebsiteContent");
    const { GalleryItem } = await import("../models/GalleryItem");
    const { INITIAL_GALLERY } = await import("../data/galleryData");
    const { hashPassword } = await import("./auth");

    // Seed SaaS Settings
    await getSaaSSettings();

    let clinic = await Clinic.findOne();
    if (!clinic) {
      console.log("No clinics found. Seeding default clinic for Anil Sharma Dental Hospital...");
      const legacySettings = await ClinicSettings.findOne();

      clinic = await Clinic.create({
        slug: "default",
        name: "Anil Sharma Dental Hospital",
        alternateName: "A.K. Sharma Dental Hospital",
        email: process.env.ADMIN_EMAIL || legacySettings?.email || "contact@sharmadental.com",
        phone: "+91 (Contact Number Placeholder)",
        whatsappPhone: "+91 (WhatsApp Number Placeholder)",
        address: "Anil Sharma Dental Hospital, (Exact Address Placeholder)",
        logo: legacySettings?.logo || "",
        gstNumber: legacySettings?.gstNumber || "GST Pending Verification",
        status: "active",
        trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
      console.log("Seeded default clinic:", clinic.name, clinic._id);
    } else {
      let needsSave = false;
      if (!clinic.slug) {
        clinic.slug = "default";
        needsSave = true;
      }
      if (!clinic.status) {
        clinic.status = "active";
        needsSave = true;
      }
      if (!clinic.alternateName) {
        clinic.alternateName = "A.K. Sharma Dental Hospital";
        needsSave = true;
      }
      if (clinic.name === "Dental Clinic") {
        clinic.name = "Anil Sharma Dental Hospital";
        needsSave = true;
      }
      if (needsSave) {
        await clinic.save();
      }
    }

    // Seed default services for the clinic
    const { seedDefaultServicesForClinic } = await import("../models/ClinicService");
    await seedDefaultServicesForClinic(clinic._id);

    // Seed WebsiteContent if not exists
    const existingContent = await WebsiteContent.findOne({ clinicId: clinic._id });
    if (!existingContent) {
      await WebsiteContent.create({
        clinicId: clinic._id,
      });
      console.log("Seeded default WebsiteContent for clinic:", clinic._id);
    }

    // Seed initial Gallery items if none exist
    const galleryCount = await GalleryItem.countDocuments({ clinicId: clinic._id });
    if (galleryCount === 0) {
      for (const item of INITIAL_GALLERY) {
        await GalleryItem.create({
          clinicId: clinic._id,
          title: item.title,
          alt: item.alt,
          imageUrl: item.imageUrl,
          category: item.category,
          isFeatured: item.isFeatured,
        });
      }
      console.log("Seeded initial gallery items for clinic:", clinic._id);
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log("No users found. Seeding default clinic administrator...");
      const email = process.env.ADMIN_EMAIL || "admin@sharmadental.com";
      const rawPassword = process.env.ADMIN_PASSWORD || "Password123";
      const password = await hashPassword(rawPassword);

      const user = await User.create({
        clinicId: clinic._id,
        name: "Clinic Administrator",
        email: email.toLowerCase(),
        password,
        role: "owner",
      });
      console.log("Seeded default owner user:", user.email, user._id);
    }

    const superAdmin = await User.findOne({ role: "admin" });
    if (!superAdmin) {
      console.log("No SaaS Super Admin found. Seeding default super admin...");
      const email = process.env.SUPERADMIN_EMAIL || "superadmin@dentalos.com";
      const rawPassword = process.env.SUPERADMIN_PASSWORD || "Superadmin123";
      const password = await hashPassword(rawPassword);

      const user = await User.create({
        name: "SaaS Super Admin",
        email: email.toLowerCase(),
        password,
        role: "admin",
      });
      console.log("Seeded default SaaS Super Admin user:", user.email, user._id);
    }

    // Migrate legacy documents that are missing clinicId to default clinic
    const { Patient } = await import("../models/Patient");
    const { Appointment } = await import("../models/Appointment");
    const { Treatment } = await import("../models/treatment");
    const { ContactMessage } = await import("../models/ContactMessage");

    const defaultClinicId = clinic._id;

    await Patient.updateMany(
      { clinicId: { $exists: false } },
      { $set: { clinicId: defaultClinicId } }
    );
    await Appointment.updateMany(
      { clinicId: { $exists: false } },
      { $set: { clinicId: defaultClinicId } }
    );
    await Treatment.updateMany(
      { clinicId: { $exists: false } },
      { $set: { clinicId: defaultClinicId } }
    );
    await ContactMessage.updateMany(
      { clinicId: { $exists: false } },
      { $set: { clinicId: defaultClinicId } }
    );
    await User.updateMany(
      { clinicId: { $exists: false }, role: { $ne: "admin" } },
      { $set: { clinicId: defaultClinicId } }
    );
  } catch (err) {
    console.error("Auto-seeding error:", err);
  }
}

export async function connectDB() {
  if (cached.conn) {
    if (cached.seeded) {
      return cached.conn;
    }
    try {
      cached.seeded = true;
      await seedDefaultClinicAndUser();
      return cached.conn;
    } catch (err) {
      cached.seeded = false;
      console.error("Seeding on cached connection failed:", err);
      return cached.conn;
    }
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    if (!cached.seeded) {
      cached.seeded = true;
      await seedDefaultClinicAndUser();
    }
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    cached.seeded = false;
    console.error("Failed to establish MongoDB connection:", e);
    throw e;
  }

  return cached.conn;
}
