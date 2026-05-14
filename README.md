# 🎓 School Management System - Industrial N°6

> **Professional administrative suite for grades, student management, and institutional reporting.**

---

## 📜 Changelog

### 🚀 [3.6.4] - 2026-05-13 (Administrative Reporting and Preceptor Management)
**"Multi-Course Preceptor Assignments and Smart Subject Abbreviations"**

#### ✨ New Features and Improvements
*   **👥 Multi-Course Preceptor Assignment**:
    *   **Double Shift Support**: Preceptors can now be assigned to multiple courses simultaneously.
    *   **Dynamic UI**: Integrated a dynamic assignment list with a (+) button in the User Management modal for effortless multi-course mapping.
    *   **Global Synchronization**: All institutional reports (Attendance, Seguimiento, RAC) now automatically recognize and display the preceptor's name for every assigned course.
*   **🖨️ Smart Subject Abbreviations (Parte Semanal)**:
    *   **Intelligent Thresholding**: Implemented an automatic abbreviation engine that shortens subject names only when they exceed 25 characters, preserving readability for shorter titles.
    *   **Institutional Nomenclature**: Standardized abbreviations for long technical terms (e.g., *Mantenimiento* → *Mant.*, *Sistemas* → *Sist.*, *Técnico* → *Téc.*) to ensure perfect fit within the weekly schedule grid.
*   **📐 Report Layout & Styling Refinement**:
    *   **Seguimiento A4**: Realigned the Preceptor field to the right of the Technical Career for a more professional balance.
    *   **Visual Hierarchy**: Applied a subtle light gray background (`#f4f4f4`) to the information headers in Seguimiento and AllGrades reports to improve scannability.
    *   **Academic Back-Page (Grades)**: Added missing institutional rows ("3er. Informe Orientador" and "3er. Cuatrimestre") to the academic grade sheet (dorsal).
    *   **Precision Alignment**: Fixed student name alignment (Left-aligned with 2px padding) to prevent text collision with table borders.

### 🚀 [3.6.3] - 2026-05-10 (Database Optimization and Performance)
**"Cloudflare D1 Query Refactoring and Indexing"**

#### ✨ New Features and Improvements
*   **⚡ D1 "Rows Read" Optimization**:
    *   **SQL Indexing**: Added critical indexes to `historial_escolar` and `alumnos` tables to prevent full-table scans during dashboard and summary loads.
    *   **Query Aggregation (O(1) Reads)**: Completely refactored the `year_summary` API endpoint. Replaced the N+1 nested subquery pattern with three highly efficient `GROUP BY` queries, mathematically reducing daily "Rows Read" consumption by over 95%.

### 🚀 [3.6.2] - 2026-05-07 (Report Optimization and Grades UX)
**"Grades Panel Redesign, Single-Page Bulletin, and Graduate Mobile UX"**

#### ✨ New Features and Improvements
*   **📊 GradesPanel Redesign**:
    *   **Search Independence**: Separated bulletin lookup (ID) from the global save action. Added a dedicated **"View Bulletin"** button with an eye icon for quick access.
    *   **Optimized Search Engine**: Fixed student filtering in the grades panel; now supports instant search by First Name, Last Name, or ID.
*   **📱 Graduate Mobile Optimization**:
    *   **Compact Layout**: Visual redesign that hides secondary columns (ID) and reduces font sizes in titles and names to ensure readability on small screens.
    *   **Curricular Simplification**: Automatic cleanup engine for technical career names (e.g., removes the "Tecnicatura en..." prefix).
*   **🖨️ Single-Page Bulletin**:
    *   **Space Efficiency**: Adjusted margins and paddings in the A4 print engine to ensure institutional signatures always remain on the first page, even for courses with heavy workloads.

#### 🛠️ Patch Fixes
*   **🩹 Search Fix**: Resolved the inconsistency in `rotationFilteredStudents` that prevented correct student filtering in preceptor mode.

### 🚀 [3.6.1] - 2026-05-06 (Pending Subjects and Graduates Refinement)
**"Smart Pending Subjects Management and Global Graduate Sync"**

#### ✨ New Features and Improvements
*   **🎓 Dynamic Pending Subjects Management**:
    - **Curricular Normalization**: Smart search engine that ignores accents and capitalization, grouping identical subjects (e.g., *Math*) across different years.
    - **Workload Differentiation**: 
        - Unique subjects autocomplete the year automatically.
        - Repeated subjects enable a dropdown selector filtered by the student's technical career.
    - **Search UX**: Included visual "year hints" (e.g., `Computing (1st)`) in search results for unambiguous identification.
*   **📊 Interactive Graduate Registry**:
    - **Real-Time Editing**: Admins can now modify a graduate's status between **Graduated** (with debt) and **Received** (no debt) directly from the table.
    - **Historical Sync (RAC)**: Status updates propagate automatically to the `historial_escolar` table, ensuring RAC and background prints reflect the change instantly.
*   **🎨 Graduation Visual Identity**:
    - **Premium Color Code**:
        - **Gold**: Visual identification for **Graduated** students.
        - **Emerald (Green)**: Visual identification for **Received** students.
    - Badges and avatars now use this institutional palette for a quick visual audit of the graduation status.

#### 🛠️ Patch Fixes
*   **🩹 API Robustness (D1)**: 
    - Implemented partial updates in the student handler to prevent type errors (`D1_TYPE_ERROR`) for omitted fields.
    - Normalized data types (`toNumber`) in history sync queries to ensure full compatibility with the SQL engine.

### 🚀 [3.6.0] - 2026-05-05 (Print Automation and Substitute Teachers)
**"Institutional Schedule Templates and Smart Teacher Detection"**

#### ✨ New Features and Improvements
*   **📋 Dynamic Schedule Templates**: 
    - Implemented `HORARIOS_TEMPLATES` that automatically adjust based on the **Shift** (Morning/Afternoon) and **Cycle** (Basic/Upper).
    - This ensures that time slots and breaks exactly match the official institutional schedule structure.
*   **👥 Advanced Substitute Management in Printing**:
    - **Automatic Detection**: The system now analyzes assignment metadata to identify substitute teachers.
    - **Dual Display**: When printing the schedule, if a substitute exists, both names (Main and Substitute) are shown clearly and professionally.
*   **📐 A4 Space Optimization**:
    - Dynamic calculation of row heights (`rowHeight`) by subtracting break times to maximize readability on the printed page without overflowing.
*   **🔄 Data Migration and Auto-correction**:
    - New logic that automatically validates and corrects the grid structure upon printing, ensuring compatibility of old schedules with the new institutional templates.

#### 🛠️ Patch Fixes
*   **🩹 Cycle Logic Fix**: Corrected year comparison logic (`parseInt`) for accurate classification between Basic and Upper Cycles across all printing modules.

### 🚀 [3.5.9] - 2026-05-04 (Mobile UX Optimization)
**"Responsive Schedules and Attendance Redesign"**

#### ✨ New Features and Improvements
*   **📱 Mobile Schedules Redesign**:
    - **Interactive Carousel**: Transformed the desktop schedule grid into a dynamic carousel for mobile devices that automatically centers the current day.
    - **Stack-style Mass Editor**: Adapted the mass teacher assigner to a vertical "cards" format, simplifying visualization on small screens by hiding redundant fields.
*   **📱 Mobile Attendance Panel Improvements**:
    - **UI Animations**: Integrated a smooth slide-fade visual effect when navigating between days of the week.
    - **Optimized Legends**: Restructured and grouped attendance references responsively to fit harmoniously and prevent overflowing.
*   **🛡️ UX and Security (Attendance)**:
    - Added a preventive check (`window.confirm`) when attempting to mark a general Teacher Strike to avoid accidental overwrites.

#### 🛠️ Patch Fixes
*   **🩹 Module Accessibility**: Removed conditional blocks (`!isMobile`) in the central panel that prevented smartphone access to the Schedules module.

### 🚀 [3.5.8] - 2026-04-29 (Global Graduates System and Academic Refinement)
**"Historical Registry, Differentiated Graduation, and Promotion Audit"**

#### ✨ New Features and Improvements
*   **🎓 Global Graduate Registry**:
    - **Centralized Panel**: New "Graduates" tab restricted to administrative roles (`admin`, `secretaria_de_alumnos`).
    - **Historical List**: Global repository of all students who finished 6th year, with search and filtering by graduation status.
    - **Technical Record**: Direct access to the graduate's file and academic background from the global list.
*   **🔄 End of Cycle Refactoring (6th Year)**:
    - **Differentiated Graduation**: New logic for final year students to classify them as **Received** (no debt) or **Graduated** (with pending subjects).
    - **Automatic Closing**: Upon graduation, the system unlinks the student from the active course, logs their graduation cycle, and updates their status to "Graduated" (`estado = 2`).
*   **📝 Automatic Promotion Audit**:
    - **Smart Tagging**: The system now automatically analyzes the total of pending subjects and current year subjects to log in the student's file:
        - *Promoted*: No pending subjects.
        - *Promoted with debt*: With pending subjects.
        - *Repeating*: Indicates the school year to repeat.
    - **Pedagogical Observations**: New section in the Student File consolidating promotion history and administrative notes.

#### 🛠️ Patch Fixes
*   **🗄️ DB Synchronization**: Production schema update to support graduation metadata (`egresado_tipo`, `ciclo_egreso`).

### 🚀 [3.5.7] - 2026-04-28 (Transfer Fixes)
**"Global Access to Transfer Destinations for Preceptors"**

#### 🛠️ Patch Fixes
*   **🔄 Student Transfer Fix**: Resolved the bug that showed an empty destination course list for preceptors/assistants.
*   **⚙️ Course Visibility Optimization**: Decoupled the institutional course list (`allCourses`) from personal navigation restrictions, ensuring all administrative transfer operations have full institutional information.

### 🚀 [3.5.6] - 2026-04-28 (Academic Year Reports and Data Stability)
**"Academic Summary, History Fix, and D1 Optimization"**

#### ✨ New Features and Improvements
*   **📊 Academic Year Summary Module**:
    *   **Statistics Dashboard**: New "View Details" function in Settings offering an instant breakdown of the selected school year.
    *   **Population Metrics**: Real-time calculation of active and transferred students throughout the cycle.
    *   **Course Breakdown**: Detailed report for each division including Gender Distribution and Repeating Student Count.
*   **🕵️ Repeating Student Count Refactoring**:
    *   **History-based Logic**: The system now scans the background table (`historial_escolar`) for repeating marks to ensure reports reflect the academic reality of enrolled students.

#### 🛠️ Patch Fixes
*   **🩹 Background Visualization Fix**: Resolved the inconsistency that prevented viewing academic history in certain student profiles after the last migration.
*   **⚙️ API Stability (D1 SQL)**: 
    *   Fixed parameter binding errors in Cloudflare D1 causing the summary module to fail.
    *   Schema synchronization: Updated table and column names in SQL queries to strictly match the production schema.

### 🚀 [3.5.5] - 2026-04-28 (Security, Audit, and Pro Search)
**"Bcrypt, History Categorization, and Advanced Search"**

#### ✨ New Features and Improvements
*   **🔐 Password Security (Bcrypt)**:
    - **Bcrypt Hash**: Migrated password storage from plaintext to robust Bcrypt hashes.
    - **Transparent Auto-migration**: Dual validation system that automatically hashes old passwords after the first successful login.
*   **🕵️ Refined Audit and Validation**:
    - **Duplicate Detection**: New validation system for user creation preventing duplicate registrations, displaying a clear visual warning in the admin modal.
    - **Smart History Categorization**: 
        - Password changes and resets are now strictly grouped under the **System** tab (Pink/Config) for better administrative traceability.
        - **Schedules** updates have been moved to **Edits (All)** so preceptors have direct visibility of academic changes.
*   **🔍 Pro Search in Settings**:
    - **Multi-Criteria Search**: The user management search engine now allows filtering by **Role**, **Course** (for preceptors), and **Subject** (for teachers), in addition to the traditional name and ID.
*   **⏳ Sliding Sessions**:
    - **1-Hour Expiration**: Session configuration with a one-hour expiration.
    - **Automatic Refresh**: Implemented an API middleware (`X-Refresh-Token`) and a global frontend interceptor to automatically renew the token upon user activity, preventing inactive logouts.

### 🚀 [3.5.4] - 2026-04-28 (Dynamic Security Alerts)
**"Special Messaging for Administrative Resets"**

#### ✨ New Features and Improvements
*   **🛡️ Improved Reset Protocol**:
    - **Origin Identification**: Implemented the `reset_by_admin` flag in the DB and API to differentiate between the first general login and an admin-forced reset.
    - **Special Security Warning**: The welcome modal now detects if the password was set by an admin, displaying a specific warning message ("Security Action") with alert iconography to encourage immediate password change.
    - **Status Synchronization**: Automatic clearing of the reset flag once the user sets their own password or acknowledges the current one.

### 🚀 [3.5.3] - 2026-04-28 (Hybrid Roles and Session Stability)
**"Comprehensive Support for Teachers/Preceptors and Session Robustness"**

#### ✨ New Features and Improvements
*   **🎭 Support for Hybrid Users (Teacher + Preceptor)**:
    - **Granular Permissions**: Full refactoring of API handlers (**Attendance**, **Students**, **Grades**, and **Locks**) to recognize and append hybrid user permissions. Teachers with preceptor duties can now manage their assigned courses without role conflicts.
    - **Dynamic Interface**: The preceptor panel now automatically detects hybrid teachers, enabling the **Attendance**, **Students**, **Subjects**, **RAC**, and **History** tabs previously restricted.
    - **View Modes**: Enabled access to the "All Subjects" view for hybrid teachers, allowing them to oversee the entire course as preceptors.
*   **🛠️ UI/UX Refinement**:
    - **Permission Flags**: Updated logic in `usePreceptorLogic` to enable transfer actions and student management based on the sum of user privileges.
    - **Smart Sector Selector**: The attendance panel now pre-selects the correct sector for hybrid users, optimizing the data entry flow.

#### 🛠️ Patch Fixes
*   **Proactive Anti-Logout**: Eliminated the 403 (Forbidden) error as a trigger for automatic logout. Users are no longer expelled when attempting to access restricted sections; instead, they receive a notification preserving their token.
*   **Hybrid Status Persistence**: Included the `is_professor_hybrid` flag in the authentication payload for immediate UI configuration after login.

### 🚀 [3.5.2] - 2026-04-27 (Refined Audit and Login Security)
**"Log Privacy and Mandatory Welcome Protocol"**

#### ✨ New Features and Improvements
*   **🕵️ Audit System Refactoring**:
    *   **Granular Privacy**: Restricted visibility of **Students**, **Attendance**, and **System** logs exclusively to **Admin** and **Head of Assistants** roles, protecting operational traceability.
    *   **Color Visualization**: Implemented visual indicators (left border) for system logs: **Green** for user creation and **Yellow/Orange** for updates.
    *   **Tab Optimization**: **System** logs are now confined to their own tab (hidden for unauthorized roles) and excluded from the general "All" view to reduce visual noise.
    *   **Official Nomenclature**: Updated grade history labels to **"Grade Entry"** and **"Edition"**, with auto-reset logic after deletions.
*   **🛡️ Mandatory Welcome and Security**:
    *   **Login Protocol**: New mandatory window upon login requesting a password change as an institutional security measure.
    *   **Anti-Bypass Persistence**: Implemented `sessionStorage` blocking, ensuring the window cannot be bypassed even upon page reloads or URL manipulation until an option is chosen.
    *   **Password Self-Management**: Developed a new backend endpoint and frontend logic allowing any user to securely update their own password without administrative intervention.

### 🚀 [3.5.1] - 2026-04-27 (Role Security and Head of Teachers)
**"Permissions Hardening and Administrative Expansion"**

#### ✨ New Features and Improvements
*   **👑 New Role: Head of Teachers**:
    *   **Academic Management**: Specialized access for managing **Schedules** and **Subject/Career Settings**.
    *   **Read-Only Supervision**: Read-only permissions in Grades (RAC) and History for institutional monitoring.
    *   **UI/UX Integration**: Incorporated the role in the user creation selector and course exclusion logic (pure administrative role).
*   **🛡️ Permissions Matrix Synchronization**:
    *   **Administrative Hardening**: Strict permission adjustments for **Student Secretariat** and **Directive** roles. They now operate in **Read-Only** mode in Attendance and History modules, preserving operational data integrity.
    *   **RAC Metadata Protection**: Restricted editing of master data (Enrollment, Book, Folio, File ID) in the RAC panel, reserved exclusively for roles with student management permissions.
*   **🛡️ API Security**: Reinforced backend handlers (`attendance`, `students`, `admin`) to validate write permissions against the official role matrix.

#### 🛠️ Patch Fixes
*   **DB Schema Update**: Executed SQL migration to expand the `CHECK` constraint on the `usuarios` table, allowing persistence of new institutional roles.

### 🚀 [3.5.0] - 2026-04-27 (Sectors, Navigation, and Editorial Polish)
**"Multi-Sector Structure and Smart Navigation"**

#### ✨ New Features and Improvements
*   **🏆 Multi-Sector Attendance**:
    *   **Data Entry Segmentation**: Implemented differentiated sectors (**Theory**, **Workshop**, and **Physical Education**) for attendance tracking, enabling precise academic area management.
    *   **Database Consistency**: Updated SQL schema and API handlers to support data persistence per sector.
*   **🏹 Agile Course Navigation**:
    *   **Quick-Switch**: Added navigation arrows (Chevron) next to the course selector for fast and fluid switching between divisions without reopening the dropdown menu.
    *   **Boundary Detection**: Smart logic that disables arrows upon reaching the beginning or end of the institutional list.
*   **🖨️ Editorial Excellence in Printing**:
    *   **Break Precision**: Standardized the break bar to **15px** with **7pt** typography, achieving the perfect balance between "visual line" and space saving.
    *   **Automatic Free Time**: Cells without an assigned subject now automatically display the **"HORARIO LIBRE"** label centered in soft gray, eliminating visual noise from empty fields.
*   **🎨 Schedule Visual Polish**:
    *   **High-Visibility (Golden Border)**: "Free Time" input fields in the editor are now highlighted with a solid gold border (`#ffb300`) for immediate identification during data entry.
    *   **Identity Restored**: Restored dynamic color logic in specialty badges and increased font size to **0.8rem** for maximum readability.
*   **🛡️ Role Audit**:
    *   **Permissions Report**: Created a detailed technical matrix of roles and permissions (`reporte_roles_permisos.txt`) for institutional security audits.

### 🚀 [3.4.1] - 2026-04-26 (Print Excellence and Visual Polish)

#### ✨ New Features and Improvements
*   **🖨️ Faithful Print Color**:
    *   **Background Hardening**: Implemented `print-color-adjust: exact` to force the printing of color banners, overcoming default browser restrictions.
    *   **Mass Consistency**: Ensured the preservation of institutional colors in mass PDF generation for all courses.
*   **🎨 Visual Identity Consolidation**:
    *   **Global Badge System**: Unified role tags into a single styling engine (`index.css`), eliminating conflicts between panels.
    *   **Solid Aesthetics**: Transitioned from translucent backgrounds to solid, vibrant colors with Extra Bold typography, improving immediate readability of hierarchical positions.

### 🚀 [3.4.0] - 2026-04-26 (Automation and Schedule Structure)
**"Smart Synchronization and Integrity Validation"**

#### ✨ New Features and Improvements
*   **📅 Schedule Structure Automation**:
    *   **Institutional Templates**: Implemented 4 fixed scenarios (Morning/Afternoon x Basic/Upper Cycle) with automated break blocks.
    *   **Invisible Synchronization**: The system now automatically detects and applies the correct structure when loading any course, re-placing subjects and teachers into fixed slots without data loss.
    *   **"Break" Aesthetics**: Minimalist design for break blocks, serving exclusively as a visual guide.
*   **🛡️ Real-Time Integrity Validation**:
    *   **Structure Hardening**: Removed controls to add or delete rows, ensuring the schedule always respects institutional norms.
    *   **Error Detection (Red Glow)**: Real-time validation system highlighting invalid data with red borders.
    *   **Save Blocking**: Active protection preventing schedule saves if invalid fields exist.
*   **👥 Refined User Management**:
    *   **Optional Password on Edit**: Enabled profile editing without requiring password resets (leaving the field empty preserves the current one).

### 🚀 [3.3.0] - 2026-04-26 (Digital Record and Automation)
**"Photographic File and Smart Record"**

#### ✨ New Features and Improvements
*   **📂 Student Digital Record**:
    *   **Attached Images**: New section in the student file to attach documents (ID, medical certificates, etc.) via ImgBB API integration.
    *   **Secure Management**: File upload and deletion restricted to edit mode to prevent accidental changes.
    *   **Quick Access**: Direct opening of original images in a new tab.
*   **🧠 Smart Record**:
    *   **Automatic Age Calculation**: Real-time age calculation based on birth date.
    *   **ID Cleanup**: Automation that removes hyphens and non-numeric characters upon editing.

### 🚀 [3.2.1] - 2026-04-26 (Visual Communication)
**"Announcements with Rich Media"**

#### ✨ New Features and Improvements
*   **📸 Multimedia Integration**:
    *   **Direct Upload**: New image upload system from the announcements panel with native ImgBB API integration.
    *   **Content Detection**: Automatic detection and rendering of image URLs and YouTube videos within the announcement body.
*   **👨‍🏫 Automatic Permissions Synchronization**:
    *   **Single Source of Truth**: Removed manual subject assignment in user management. Teacher permissions now derive exclusively from the **Schedules Panel**.
*   **🛡️ Hierarchical Role Exclusivity**:
    *   **Directive Hardening**: Administrative roles are now strictly administrative. The system automatically clears and blocks any subject assignments for these users.

### 🚀 [3.2.0] - 2026-04-25 (DB Scalability and Print Excellence)

#### ✨ New Features and Improvements
*   **⚡ Critical Performance Optimization**:
    *   **Batch Processing (API)**: Refactored endpoints to group multiple queries into a single server roundtrip (`env.DB.batch`), reducing latency by 70%.
*   **🖨️ Bulletin Redesign (A4 Landscape)**:
    *   **Professional Layout**: Transitioned to landscape orientation to maximize readability.
*   **📅 "Glassfrost" Schedules Panel**:
    *   **Premium Aesthetics**: New design based on translucent white and synchronized blur.
    *   **Mass Schedule Printing**: New feature to generate schedules for ALL courses in a single process.

### 🚀 [3.0.6] - 2026-04-24 (Print Correction)
#### 🛠️ Patch Fixes
*   **Teacher Fix in Spreadsheets**: Resolved the bug leaving the "Teachers in charge" field empty in A4 grade spreadsheets.
*   **Multi-Role Support**: Expanded teacher detection logic to include preceptors and hybrid roles.

### 🚀 [3.0.5] - 2026-04-24 (Security Update)
#### ✨ New Features and Improvements
*   **📋 Direct Access to Record (Transfers)**: New feature in the **Transfers** panel allowing direct access to the **Student File**.
*   **🏗️ Career Copy Improvement**: Optimized curricular structure duplication logic.

### 🚀 [3.0.0] - 2026-04-23 (Dynamic Schedule Management)
#### ✨ New Features and Improvements
*   **📅 Smart Schedule System**:
    *   **Pro Autocomplete**: Implemented `SearchableSelect` with fuzzy search.
    *   **"Free Time" Display**: Specific design for free periods with centered alignment.
    *   **🖨️ Schedule Printing**: New print view optimized for PDF/A4.

### 🚀 [2.9.9] - 2026-04-23 (UI/UX Refinement and Mobile App)
#### ✨ New Features and Improvements
*   **💾 Dynamic Save Button**: Redesigned save button toggling between **"Saved"** and **"Save Changes"**.
*   **🫨 Visual Feedback (Shake)**: Shake animation triggered on pending changes.
*   **📱 Critical Mobile Optimization**: Adapted layouts and icons for smartphone displays.
*   **🤖 Capacitor Integration**: Project preparation for Native App compilation (Android/APK).

### 🚀 [2.9.8] - 2026-04-23 (Audit and Attendance)
#### ✨ New Features and Improvements
*   **📅 Monthly Attendance Panel**: Comprehensive module for daily tracking with interactive grid.
*   **🖨️ Weekly Reports Printing**: Auto-filled A4 weekly reports generation.

### 🚀 [2.9.5] - 2026-04-22 (Teacher Automation)
#### ✨ New Features and Improvements
*   **👨‍🏫 Teacher Accounts Automation**: Mass credential generation for 104 teachers with smart subject mapping.
*   **🎓 Institutional Identity**: Automatic "Prof." prefix implementation in official reports.

### 🚀 [2.9.0] - 2026-04-22 (JWT Authentication)
#### ✨ New Features and Improvements
*   **🔐 JWT Implementation**: Migration to digitally signed auth (HMAC-SHA256) with 24-hour expiration.
*   **🛡️ Backend Verification**: Centralized validation in Cloudflare Functions.

### 🚀 [2.8.6] - 2026-04-22 (Modular Refactoring)
#### ✨ New Features and Improvements
*   **🏗️ Modular Architecture**: Fragmentation of `PreceptorPanel` into specialized sub-modules.

### 🚀 [2.8.5] - 2026-04-21 (Modular RAC and Printing)
#### ✨ New Features and Improvements
*   **🧩 Configurable Modular RAC**: Option to enable detailed view (**T / P / Pnd**) in modular workshop subjects.

### 🚀 [2.8.0] - 2026-04-21 (Institutional Daily Report)
#### ✨ New Features and Improvements
*   **📋 Official A4 Daily Report**: Mass generation of daily reports for ALL courses with integrated schedules.

### 🚀 [2.7.0] - 2026-04-21 (Secure Access and Audit)
#### ✨ New Features and Improvements
*   **🔍 Student Password Access**: Protected portal via ID + Password.
*   **📜 Detailed Audit (History)**: Logging of critical actions (password changes, profile edits, transfers).

### 🚀 [2.6.6] - 2026-04-20 (Quality Control)
#### 🛠️ Patch Fixes
*   **🔍 Code Audit (Linter)**: Eliminated orphaned variables project-wide.
*   **🧹 Dead Code Cleanup**: Removed obsolete functions.

### 🚀 [2.6.5] - 2026-04-20 (Hash Navigation)
#### ✨ New Features and Improvements
*   **🌐 Hash Routing**: Migration to `HashRouter` for navigable URLs and session persistence.
*   **🔒 Protected Routes**: Smart redirection system protecting administrative routes.

### 🚀 [2.6.3] - 2026-04-20 (Cascade Locks)
#### ✨ New Features and Improvements
*   **🔍 Cascade Locks**: Smart logic disabling previous trimester fields upon final instance approval.

### 🚀 [2.6.0] - 2026-04-20 (Academic Cycle Closure)
#### ✨ New Features and Improvements
*   **🎓 Cycle Termination (RAC)**: Centralized workflow for year-end closure, repitence automation, and promotion control.
*   **📋 Academic History**: Automated historical logging (Bulletin snapshot) during cycle transition.

### 🚀 [2.5.0] - 2026-04-19 (Institutional Hierarchy)
#### ✨ New Features and Improvements
*   **🏢 Institutional Hierarchy**: Support for `Director`, `Vice Director`, and `Student Secretariat` roles.
*   **📣 Announcements Center**: New multimedia institutional communication module.
*   **🕵️ Visual Audit**: Updated with role codes and distinctive color palette.

### 🚀 [2.4.0] - 2026-04-19 (Modularization)
#### ✨ New Features and Improvements
*   **✂️ Print Decoupling**: Massive extraction of printing logic to `PrintHelpers.jsx`.
*   **📄 Student Record**: Implementation of a new centralized technical record modal.

### 🚀 [2.3.0] - 2026-04-19 (Data Hardening)
#### ✨ New Features and Improvements
*   **🔒 System Hardening**: Robust `estado` (Active/Inactive) field implementation for historical integrity.
*   **Bone Skeleton Loading**: Smart loading screens for fluid UX.

### 🚀 [2.2.0] - 2026-04-18 (Consolidated Architecture)
#### ✨ New Features and Improvements
*   **📂 Global Consolidation**: Total restructuring into flat `src/jsx/` and `src/css/` folders.
*   **🧩 Modular CSS**: Core aesthetic fragmentation into independent modules.

### 🚀 [2.1.0] - 2026-04-18 (Print Engine)
#### ✨ New Features and Improvements
*   **📏 A4 Print Engine**: Metric unit-based rendering engine (`mm`) for absolute precision.
*   **📦 Mass Global Generation**: Creation of tracking spreadsheets for all courses in a single document.

### 🚀 [2.0.0] - 2026-04-18 (Core Modularization)
#### ✨ New Features and Improvements
*   **🧩 Modularization**: `PreceptorPanel` fragmentation.
*   **💾 D1 Optimization**: SQL indexing and `COALESCE` protection logic.

---

### Initial Versions (1.x.x)

*   **[1.7.0]**: Implemented **Mobile Access Toggle** and academic cycle configuration panel.
*   **[1.6.0]**: Admin-exclusive deletion restrictions and **Active/Inactive** course states.
*   **[1.5.0]**: Layout adjustments for **A4 Ready** printing, institutional branding, and auto-alphabetical sorting.
*   **[1.4.0]**: Role System (Admin, Preceptor, Teacher, Viewer) and dynamic Academic Calendar.
*   **[1.3.0]**: Full migration from KV to **Cloudflare D1 (SQL)** for real-time consistency and latency optimization.
*   **[1.2.0]**: Asset organization in `/js` and `/css` directories with orphan file debugging.
*   **[1.1.0]**: Modular CSS architecture for *Glassmorphism* design.
*   **[1.0.0]**: Initial launch: Cloudflare Pages deployment, ID search, and basic grade entry.

---
*Developed with ❤️ for the educational community.*
