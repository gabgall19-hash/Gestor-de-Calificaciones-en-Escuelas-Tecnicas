# TestSprite Specification: School Management System (Industrial Nº6)

## 1. Project Overview
A professional administrative suite for managing grades, students, and institutional reports for "Escuela Industrial Nº6".

**Tech Stack:**
- **Frontend:** Vite + React + Vanilla CSS.
- **Backend:** Cloudflare D1 (SQL) + Cloudflare Functions (API).
- **Authentication:** JWT (JSON Web Tokens) with 24h expiration.
- **Mobile:** Capacitor (Android/APK support).

## 2. User Roles & Access
- **Admin:** Full access (user management, database migrations, destructive actions).
- **Preceptor:** Manage student records, view grades (read-only unless also a teacher), manage attendance.
- **Professor:** Enter/edit grades for assigned subjects.
- **Student:** View personal bulletin (requires DNI + Password).

## 3. Core Modules & Testing Scenarios

### 3.1 Authentication
- **Test Case 1:** Login with valid DNI and Password.
- **Test Case 2:** Session persistence (F5 proof).
- **Test Case 3:** Auto-logout on token expiration.
- **Test Case 4:** Accessing administrative panels without a token (should redirect to login).

### 3.2 Grades Panel (Notas)
- **Test Case 1:** Enter grades (values 1-10).
- **Test Case 2:** Save button logic:
    - Should be "Guardado" (Green/Disabled) when no changes are made.
    - Should be "Guardar Cambios" (Blue/Animated) when a grade is changed.
    - Should trigger "btn-shake" animation when changes are pending.
- **Test Case 3:** Cascading blocks: If a student passes (>=7) in final instances (Marzo/Otras), earlier instances (3rd Trim, Dec, Feb) should lock.
- **Test Case 4:** Column width consistency: All grade columns should be 50px wide.

### 3.3 Attendance Panel (Asistencia)
- **Test Case 1:** Monthly grid interaction.
- **Test Case 2:** Mobile view: Cycle through P (Presente) -> A (Ausente) -> AJ (Ausente Justificado) via tap/click.
- **Test Case 3:** Search for student by name within the attendance grid.
- **Test Case 4:** Weekend filtering (Only Mon-Fri should be editable).

### 3.4 Report Generation & Printing
- **Test Case 1:** Generate RAC (Modular) report. Verify left-alignment for student identity columns.
- **Test Case 2:** Generate "Parte Diario" (A4). Ensure no blank pages are generated during bulk creation.
- **Test Case 3:** Printing scale: Verify layout fits A4 dimensions (297mm height) with `overflow: hidden`.

### 3.5 Student Management
- **Test Case 1:** Search student by DNI.
- **Test Case 2:** Edit student details (Ficha del Alumno).
- **Test Case 3:** Student status: Verify badges for "PASE" or "Inactivo" students.

## 4. Environment Configuration
- **API URL:** The system automatically detects the environment. If running via `capacitor://`, it uses the production Cloudflare API.
- **Local Testing:** Usually runs on `localhost:5173` (Vite default).

## 5. Expected UI/UX Standards
- **Aesthetics:** Glassmorphism design, vibrant colors, smooth transitions.
- **Feedback:** Skeleton loaders during data fetching.
- **Mobile:** Buttons should be replaced by icons (e.g., Printer icon) on small screens to save space.
