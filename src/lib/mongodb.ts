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
    const { hashPassword } = await import("./auth");
 
    // Seed SaaS Settings
    await getSaaSSettings();
    console.log("SaaS Settings initialized/verified.");

    let clinic = await Clinic.findOne();
    if (!clinic) {
      console.log("No clinics found. Checking legacy settings for seeding...");
      const legacySettings = await ClinicSettings.findOne();
      
      clinic = await Clinic.create({
        slug: "default",
        name: legacySettings?.name || "Dental Clinic",
        email: legacySettings?.email || "support@clinic.com",
        phone: legacySettings?.phone || "+91 99999 99999",
        address: legacySettings?.address || "Clinic Address",
        logo: legacySettings?.logo || "",
        gstNumber: legacySettings?.gstNumber || "27AAAAA1111A1Z1",
        status: "active",
        trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // long trial for seeded clinic
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
      if (needsSave) {
        await clinic.save();
        console.log("Self-healed clinic with status 'active' and slug 'default'");
      }
    }

    // Seed default services for the clinic
    const { seedDefaultServicesForClinic } = await import("../models/ClinicService");
    await seedDefaultServicesForClinic(clinic._id);
 
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log("No users found. Seeding default clinic administrator...");
      const email = process.env.ADMIN_EMAIL || "admin@example.com";
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
      const email = process.env.SUPERADMIN_EMAIL || "superadmin@example.com";
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
    console.log("Connecting to MongoDB (initializing new connection)...");
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log("MongoDB Connected successfully");
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