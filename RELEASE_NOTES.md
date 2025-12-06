# PMP Exam Simulator - Release Notes

## Version 1.1.0 - December 6, 2025

### New Features

#### Access Code Protection System
- Added site-wide access code to control student access to exams
- Students must enter a valid access code before accessing the exam selection page
- Bilingual support (English/Arabic) for the access code entry page
- Protected all public routes (exam selection, tester name, results)
- Admin can update the access code from the Settings tab in the Admin Dashboard

#### Exam Library Admin Page
- Complete exam library management with CRUD operations
- Upload exams via CSV or JSON file formats
- View all exams with question counts and duration
- Edit exam metadata and individual questions
- Delete exams with confirmation dialog
- **NEW: Hide/Show Exams** - Administrators can now hide exams from the public exam selection without deleting them
  - Toggle visibility with a single click
  - Hidden exams show a "Hidden" badge and appear dimmed in the admin view
  - Hidden exams are automatically filtered out from the student-facing exam selection page

#### Exam History Tracking
- Track all exam attempts with tester names
- Pagination support for browsing large result sets
- View detailed performance including domain breakdowns

### Improvements

#### Branding
- Added Patrons logo prominently on the access code entry page
- Increased logo size across the application for better visibility
- Logo displayed on exam selection and exam interface pages

#### Exam Data Quality
- Fixed 6 questions in "PMP Exam Full - English" exam with incorrect answer configurations (Q9, Q92, Q100, Q124, Q138, Q154)
- Corrected Q138's option text mismatch to align with the explanation
- Renumbered all question IDs to match their sequential positions for consistency

### Bug Fixes
- Fixed redirect issue after successful access code verification
- Improved state management for access control flow

### Technical Details
- Added `hidden` field to exam schema for visibility control
- Created separate API endpoints for admin (all exams) and public (visible exams only)
- Toggle visibility endpoint: `PATCH /api/admin/exams/:id/visibility`
- Access code stored securely in server-side configuration

---

### Default Access Code
The default access code is: `PMP2024`

Administrators can change this from: **Admin Dashboard > Settings > Site Access Code**
