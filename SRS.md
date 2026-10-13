# School Management System - SRS v1.1
## Complete Non-Technical Blueprint

### Overview
- **Type:** Single school management system (Web Application + Android App)
- **Languages:** Urdu (RTL), Arabic (RTL), English (LTR)
- **Users:** Admin, Teacher, Student

### Expected Outcomes
- Less duplicate paperwork and consistent records.
- Clearer fee balances, attendance, and academic progress.
- Controlled access and traceable changes to sensitive records.

### Scope at a Glance
**Included in Scope:**
- Login and roles, admissions, staff, classes, attendance, fees, homework, exams, notices, reports.

**Future Phase (Release 3):**
- Parent portal, transport, library, inventory, payroll, biometric integration.

### Phased Rollout
1. **Release 1 (Core):** Admissions, attendance, fees.
2. **Release 2 (Academics):** Homework, exams, results.
3. **Release 3 (Expansion):** Parent portal and add-ons.

### Roles & Responsibilities
- **Admin:** Manage the school (Admissions, staff, setup, fees, reports, notices, approved corrections).
- **Teacher:** Teach and assess (Assigned classes, attendance, homework, assignment review, marks entry).
- **Student:** Stay informed (Own attendance, timetable, homework, fees, notices, published results).

### Module Breakdown
1. **Accounts & Access:** Login, roles, permissions.
2. **School Setup:** Identity, classes/sections, fees, grading, attendance statuses, language/direction defaults.
3. **Student Records:** Admissions, history, promotions, withdrawals.
4. **Teacher & Staff:** Management and assignments.
5. **Attendance:** Daily workflow, corrections, monthly reports.
6. **Fees & Payments:** Fee heads, invoices, online/offline payments, receipts, partial payments, refunds.
7. **Timetable & Homework:** Scheduling and assignment tracking.
8. **Exams & Results:** Setup, marks entry, review, publish, report cards.
9. **Notices:** Announcements system.
10. **Reports & Audit:** Student strength, attendance, finance, academics, operations. PDF/Excel export.

### Key Principles
- **Attendance:** Status options (Present, Absent, Late, Approved leave). Corrections retain who changed it, when, and why.
- **Fees:** Online status must be verified. Refunds/concessions require approval.
- **Exams:** Results move through Setup -> Enter -> Review -> Publish.
- **Languages:** Language switch must not alter saved records. Forms, notifications, receipts must remain readable.
- **Security:** Role control, Audit trail (who, when, why), Backup & Restore, Payment safety, Data privacy.

### Implementation Roadmap
- **Release 1:** Core Operations (Login, setup, admissions, staff, attendance, fees, basic reports).
- **Release 2:** Academics (Timetable, homework, exams, results, notices).
- **Release 3:** Enhancements (Parent portal, transport, library, inventory, payroll).