# LuxuryStay HMS Role Permission Matrix

## Roles

- `super_admin`
- `admin`
- `manager`
- `receptionist`
- `housekeeping`
- `maintenance`
- `guest`

## Summary

### super_admin

- Full platform access

### admin

- Operational control across users, rooms, reservations, invoices, payments, reports, settings, and oversight modules

### manager

- Read-oriented oversight across reservations, finance, feedback, housekeeping, maintenance, and reports

### receptionist

- Guest handling, reservation creation, room assignment, check-in, check-out, invoices, and payment collection

### housekeeping

- Assigned tasks, cleaning board, room progress updates, and maintenance issue reporting

### maintenance

- Request queue, assignments, resolution, and closure workflows

### guest

- Own profile, reservations, invoices, payments, service requests, feedback, and notifications

## Note

Exact permission keys are currently defined in:

- `server/src/shared/constants/permissions.ts`
