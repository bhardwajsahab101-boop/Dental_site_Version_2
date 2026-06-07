import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI");
}

async function seedDefaultClinicAndUser() {
  try {
    const { Clinic } = await import("../models/Clinic");
    const { User } = await import("../models/User");
    const { ClinicSettings } = await import("../models/ClinicSettings");
    const { hashPassword } = await import("./auth");
 
    let clinic = await Clinic.findOne();
    if (!clinic) {
      console.log("No clinics found. Checking legacy settings for seeding...");
      const legacySettings = await ClinicSettings.findOne();
      
      clinic = await Clinic.create({
        slug: "bright-smile",
        name: legacySettings?.name || "Bright Smile Clinic",
        email: legacySettings?.email || "support@brightsmile.com",
        phone: legacySettings?.phone || "+91 99999 99999",
        address: legacySettings?.address || "123 Health Ave, Medical District",
        logo: legacySettings?.logo || "",
        gstNumber: legacySettings?.gstNumber || "27AAAAA1111A1Z1",
      });
      console.log("Seeded default clinic:", clinic.name, clinic._id);
    } else if (clinic && !clinic.slug) {
      clinic.slug = "bright-smile";
      await clinic.save();
      console.log("Self-healed clinic with default slug 'bright-smile'");
    }
 
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
  try {
    await mongoose.connect(MONGODB_URI);

    console.log("MongoDB Connected");

    // Seed default clinic & user if database is empty
    await seedDefaultClinicAndUser();
  } catch (error) {
    console.log(error);

    throw new Error("Database connection failed");
  }
}