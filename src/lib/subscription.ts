import { notifySubscriptionStatus } from "./notifications";
import { Clinic } from "../models/Clinic";

export interface SubscriptionDetails {
  plan: string;
  status: "active" | "expired" | "suspended";
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  daysLeft: number;
  isActive: boolean;
  productType: string;
}

/**
 * Calculates remaining days for a subscription end date.
 * daysLeft = ceil((subscriptionEndDate - currentDate) / 1 day)
 * Never allows negative values.
 */
export function calculateDaysLeft(endDateInput: any): number {
  if (!endDateInput) return 0;
  const endDate = new Date(endDateInput);
  const currentDate = new Date();
  
  const diffTime = endDate.getTime() - currentDate.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, daysLeft);
}

/**
 * Resolves subscription details dynamically from a clinic document.
 */
export function getSubscriptionInfo(clinic: any): SubscriptionDetails {
  const plan = clinic.subscriptionPlan || "Trial";
  const startDate = clinic.subscriptionStartDate || clinic.createdAt || new Date();
  const endDate = clinic.subscriptionEndDate || clinic.trialEndsAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const isActive = clinic.isActive !== false;
  const productType = clinic.productType || "DentalOS";
  
  const daysLeft = calculateDaysLeft(endDate);
  
  let status: "active" | "expired" | "suspended" = "active";
  if (!isActive) {
    status = "suspended";
  } else if (daysLeft <= 0) {
    status = "expired";
  }
  
  return {
    plan,
    status,
    subscriptionStartDate: new Date(startDate),
    subscriptionEndDate: new Date(endDate),
    daysLeft,
    isActive,
    productType,
  };
}

/**
 * Checks if current daysLeft matches a reminder threshold (15, 7, 3, 0)
 * and triggers a notification if not already sent.
 */
export async function checkAndTriggerReminder(
  clinicId: string,
  name: string,
  email: string,
  daysLeft: number,
  lastWarningDaysLeft: number | undefined
) {
  const warningThresholds = [15, 7, 3, 0];
  
  if (warningThresholds.includes(daysLeft) && lastWarningDaysLeft !== daysLeft) {
    try {
      await notifySubscriptionStatus({
        name,
        email,
        daysRemaining: daysLeft,
      });
      
      await Clinic.updateOne(
        { _id: clinicId },
        { $set: { lastSubscriptionWarningDaysLeft: daysLeft } }
      );
    } catch (err) {
      console.error(`Failed to trigger subscription warning for clinic ${clinicId}:`, err);
    }
  }
}
