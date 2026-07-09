export interface NotificationPayload {
  toEmail: string;
  toPhone?: string;
  subject: string;
  body: string;
}

/**
 * Reusable notification helper.
 * Logs to console in development and provides modular structure for production.
 */
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  const { toEmail, toPhone, subject, body } = payload;
  const isProd = process.env.NODE_ENV === "production";

  // Formatted Console Log for clean development tracing
  console.log(`
=========================================
🔔 NOTIFICATION TRIGGERED (Mock System)
=========================================
📧 EMAIL TO:    ${toEmail}
📝 SUBJECT:     ${subject}
📱 WHATSAPP TO:  ${toPhone || "Not Provided"}
-----------------------------------------
📄 CONTENT:
${body}
=========================================
`);

  if (isProd) {
    // Here we can easily integrate SMTP/Nodemailer or Twilio in the future
    // E.g., transporter.sendMail(...) or twilioClient.messages.create(...)
    // Currently, we just return true.
  }

  return true;
}

/**
 * Sends a notification when a new appointment is booked.
 */
export async function notifyAppointmentBooked(appointment: {
  fullName: string;
  email: string;
  phone: string;
  service: string;
  appointmentDate: string;
  message?: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@dental.com";
  
  // Patient confirmation
  await sendNotification({
    toEmail: appointment.email,
    toPhone: appointment.phone,
    subject: "Appointment Request Received - City Dental Group",
    body: `Hello ${appointment.fullName},

We have received your appointment request for a ${appointment.service} on ${appointment.appointmentDate}.
Our team will review your request and contact you shortly to confirm the appointment.

Thank you,
City Dental Group`,
  });

  // Admin notification
  await sendNotification({
    toEmail: adminEmail,
    subject: `New Appointment Booking: ${appointment.fullName}`,
    body: `A new appointment has been requested:

Patient: ${appointment.fullName}
Email: ${appointment.email}
Phone: ${appointment.phone}
Service: ${appointment.service}
Date: ${appointment.appointmentDate}
Message: ${appointment.message || "None"}`,
  });
}

/**
 * Sends a notification when an appointment status changes.
 */
export async function notifyAppointmentStatusChange(
  appointment: {
    fullName: string;
    email: string;
    phone: string;
    service: string;
    appointmentDate: string;
  },
  newStatus: "pending" | "confirmed" | "completed" | "cancelled"
) {
  let subject = "";
  let body = "";

  switch (newStatus) {
    case "confirmed":
      subject = "Appointment Confirmed - City Dental Group";
      body = `Hello ${appointment.fullName},

Great news! Your appointment for a ${appointment.service} on ${appointment.appointmentDate} has been confirmed.
We look forward to seeing you. Please arrive 10 minutes early.

Best regards,
City Dental Group`;
      break;
    case "cancelled":
      subject = "Appointment Cancelled - City Dental Group";
      body = `Hello ${appointment.fullName},

Your appointment for a ${appointment.service} on ${appointment.appointmentDate} has been cancelled.
If this was a mistake or you need to reschedule, please visit our website or call us.

Best regards,
City Dental Group`;
      break;
    case "completed":
      subject = "Thank you for visiting City Dental Group";
      body = `Hello ${appointment.fullName},

Thank you for choosing City Dental Group. We hope you had a comfortable visit.
Please let us know if you have any questions about your post-treatment care.

Best regards,
City Dental Group`;
      break;
    default:
      return; // No notification for pending status
  }

  await sendNotification({
    toEmail: appointment.email,
    toPhone: appointment.phone,
    subject,
    body,
  });
}

/**
 * Sends a notification when a contact form message is received.
 */
export async function notifyContactFormSubmitted(message: {
  fullName: string;
  email: string;
  message: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@dental.com";

  // Patient Auto-Reply (Optional, but professional)
  await sendNotification({
    toEmail: message.email,
    subject: "Thank you for contacting City Dental Group",
    body: `Hello ${message.fullName},

Thank you for reaching out to City Dental Group. We have received your message and will review it shortly.
Our clinic team will get back to you as soon as possible.

Message summary:
"${message.message}"

Best regards,
City Dental Group`,
  });

  // Admin Notification
  await sendNotification({
    toEmail: adminEmail,
    subject: `New Contact Inquiry: ${message.fullName}`,
    body: `You have received a new message from the contact form:

Name: ${message.fullName}
Email: ${message.email}
Message:
"${message.message}"`,
  });
}

/**
 * Sends a notification for subscription status warnings and expiration.
 */
export async function notifySubscriptionStatus(clinic: {
  name: string;
  email: string;
  daysRemaining: number;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@dental.com";
  let subject = "";
  let body = "";

  if (clinic.daysRemaining === 15) {
    subject = `Subscription Reminder: 15 Days Left for ${clinic.name}`;
    body = `Hello,

This is a friendly reminder that your subscription for ${clinic.name} has 15 days remaining. 
Please renew soon to ensure uninterrupted service.

Best regards,
LaunchStack Support`;
  } else if (clinic.daysRemaining === 7) {
    subject = `Subscription Warning: 7 Days Left for ${clinic.name}`;
    body = `Hello,

Your subscription for ${clinic.name} will expire in 7 days.
Please renew your subscription to maintain full access to your clinical dashboard.

Best regards,
LaunchStack Support`;
  } else if (clinic.daysRemaining === 3) {
    subject = `URGENT Subscription Warning: 3 Days Left for ${clinic.name}`;
    body = `Hello,

URGENT: Your subscription for ${clinic.name} expires in 3 days!
To prevent access lock-out, please renew your subscription immediately.

Best regards,
LaunchStack Support`;
  } else if (clinic.daysRemaining <= 0) {
    subject = `Subscription Expired: ${clinic.name}`;
    body = `Hello,

Your subscription for ${clinic.name} has expired.
Access to your account has been locked. Please renew now to restore access.

Best regards,
LaunchStack Support`;
  }

  if (subject && body) {
    // Send to tenant email
    await sendNotification({
      toEmail: clinic.email,
      subject,
      body,
    });
    // Send to admin email
    await sendNotification({
      toEmail: adminEmail,
      subject: `Admin Log: ${subject}`,
      body,
    });
  }
}
