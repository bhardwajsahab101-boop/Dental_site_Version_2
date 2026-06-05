# TODO

## Patient profile: Add Treatment
- [ ] Add “+ Add Treatment” button on `src/app/admin/patients/[id]/page.tsx`
- [ ] Add treatment modal form with fields: Treatment Name, Diagnosis, Tooth Number, Cost, Notes, Status
- [ ] Implement submit handler calling `POST /api/treatments`
- [ ] Attach `appointmentId` using the most recent appointment (appointments[0]) and show toast if none exist
- [ ] On success: toast + close modal + reset form + reload patient profile

