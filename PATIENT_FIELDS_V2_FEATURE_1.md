# V2 Feature #1: Patient Management System — Patient fields

## Question
**Which fields should a patient have?** (for a dental clinic)

## What the current system already does
- Appointments currently store patient-like details directly: `fullName`, `phone`, `email`, `age`, `Gender`, `Address`, `MedicalNotes`.
- Booking UI collects at least: `fullName`, `phone`, `email`, `service`, `appointmentDate`, plus a free-text `message`.

The goal of introducing a `Patient` model is to **separate persistent patient profile data** from **appointment scheduling/workflow data**.

## Clinic-focused patient fields (recommended)
### 1) Identity & contact (high utility)
- `fullName` — display and matching.
- `phone` — primary contact for changes/reminders.
- `email` — secondary contact (optional in some clinics).

### 2) Clinical context (high utility)
- `age` **or** `dateOfBirth` — demographic information that may affect treatment.
- `gender` — record completeness and potential workflow needs.
- `address` — commonly used for patient records; optional if your clinic doesn’t use it.

### 3) Medical history / safety (high utility)
Pick a structure based on how your UI will capture data:
- `medicalNotes` — a free-form field for history, conditions, medications, etc.
- `allergies` — **optional** as a separate structured field; alternatively keep it inside `medicalNotes`.

### 4) Audit / operations (recommended)
- `createdAt` — when the patient profile was created.
- `updatedAt` — when patient details were last modified.

## Final recommended Patient schema
A practical Patient model for this project:

```ts
Patient {
  fullName,
  phone,
  email?,
  age? | dateOfBirth?,
  gender?,
  address?,
  medicalNotes?,
  allergies?,
  createdAt,
  updatedAt
}
```

## Why this is better than blindly copying the initial suggestion
- `bloodGroup` is only worth collecting if your clinic actually uses it in decisions/workflows.
- Storing `allergies` inside `medicalNotes` is acceptable if you don’t have a dedicated UI/processing for it.
- `createdAt/updatedAt` should align with DB timestamps rather than being arbitrary extra fields.

## How this maps to current UI
- Booking fields (`fullName`, `phone`, `email`) map naturally into the `Patient`.
- Booking `message` maps to an appointment note (`Appointment.message`) for now, and can later be migrated into `medicalNotes` if desired.

