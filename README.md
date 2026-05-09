# 🎓 School Management System

> **Professional administrative suite for grades, student management, and institutional reporting.**

---

## 📜 Changelog

### 🚀 [3.6.2] - 2026-05-07 (Report Optimization and Grades UX)
**"Grades Panel Redesign, Single-Page Bulletin, and Graduate Mobile UX"**

#### ✨ New Features and Improvements
*   **📊 GradesPanel Redesign**:
    *   **Search Independence**: Separated bulletin lookup (ID) from the global save action. Added a dedicated "View Bulletin" button for quick access.
    *   **Optimized Search Engine**: Fixed student filtering in the grades panel; now supports instant search by First Name, Last Name, or ID.
*   **📱 Graduate Mobile Optimization**:
    *   **Compact Layout**: Visual redesign that hides secondary columns and reduces font sizes to ensure readability on small screens.
    *   **Curricular Simplification**: Automatic engine to clean up technical career names.
*   **🖨️ Single-Page Bulletin**:
    *   **Space Efficiency**: Adjusted margins and paddings in the A4 print engine to ensure institutional signatures always remain on the first page.

#### 🛠️ Patch Fixes
*   **🩹 Search Fix**: Resolved inconsistency in `rotationFilteredStudents` that prevented correct student filtering in preceptor mode.

### 🚀 [3.6.1] - 2026-05-06 (Pending Subjects and Graduates Refinement)
**"Smart Pending Subjects Management and Global Graduate Sync"**

#### ✨ New Features and Improvements
*   **🎓 Dynamic Pending Subjects Management**:
    - **Curricular Normalization**: Smart search engine that ignores accents and capitalization, grouping identical subjects across different years.
    - **Search UX**: Included visual "year hints" in search results for clear identification.
*   **📊 Interactive Graduate Registry**:
    - **Real-Time Editing**: Admins can now modify graduate status between **Graduated** (with debt) and **Received** (no debt) directly from the table.
    - **Historical Sync (RAC)**: Status updates propagate automatically to the history table.
*   **🎨 Graduation Visual Identity**:
    - **Premium Color Code**: **Gold** for "Graduated" and **Emerald Green** for "Received" students.

#### 🛠️ Patch Fixes
*   **🩹 API Robustness (D1)**: Implemented partial updates to prevent type errors. Normalized data types for SQL engine compatibility.

### 🚀 [3.6.0] - 2026-05-05 (Print Automation and Substitute Teachers)
**"Institutional Schedule Templates and Smart Teacher Detection"**

#### ✨ New Features and Improvements
*   **📋 Dynamic Schedule Templates**: Automatically adjust based on the **Shift** (Morning/Afternoon) and **Cycle** (Basic/Upper).
*   **👥 Advanced Substitute Management**: The system now analyzes metadata to identify substitute teachers and displays both names clearly when printing.
*   **📐 A4 Space Optimization**: Dynamic calculation of row heights to maximize readability.
*   **🔄 Auto-Correction Migration**: New logic automatically validates and corrects grid structure upon printing.

#### 🛠️ Patch Fixes
*   **🩹 Cycle Logic Fix**: Corrected year comparison logic for accurate classification.

### 🚀 [3.5.9] - 2026-05-04 (Mobile UX Optimization)
**"Responsive Schedules and Attendance Redesign"**

#### ✨ New Features and Improvements
*   **📱 Mobile Schedules Redesign**: Transformed desktop grid into an interactive carousel for mobile.
*   **📱 Mobile Attendance Panel**: Integrated smooth slide-fade animations. Responsive restructuring of attendance legends.
*   **🛡️ UX and Security**: Added preventive confirmation before marking general teacher strikes.

#### 🛠️ Patch Fixes
*   **🩹 Module Accessibility**: Removed conditional blocks preventing mobile access to the Schedules module.

### 🚀 [3.5.8] - 2026-04-29 (Global Graduates System)
**"Historical Registry, Differentiated Graduation, and Promotion Audit"**

#### ✨ New Features and Improvements
*   **🎓 Global Graduate Registry**: Centralized panel for 6th-year graduates, restricted to administrative roles.
*   **🔄 End of Cycle Refactoring**: Automated closing process that updates student status upon graduation.
*   **📝 Automatic Promotion Audit**: Intelligent tagging system that analyzes pending subjects to classify students as Promoted or Repeating.

#### 🛠️ Patch Fixes
*   **🗄️ DB Synchronization**: Production schema update to support graduation metadata.

### 🚀 [3.5.7] - 2026-04-28 (Transfer Fixes)
#### 🛠️ Patch Fixes
*   **🔄 Student Transfer Fix**: Resolved empty destination course list for preceptors.
*   **⚙️ Course Visibility**: Decoupled institutional course list from personal navigation restrictions.

### 🚀 [3.5.6] - 2026-04-28 (Academic Year Reports)
**"Academic Summary and D1 Optimization"**

#### ✨ New Features and Improvements
*   **📊 Academic Year Summary**: Real-time population metrics and detailed reports per course.
*   **🕵️ Repeating Student Count Refactoring**: Logic now scans historical records for accurate reporting.

#### 🛠️ Patch Fixes
*   **🩹 History Visualization Fix**: Resolved inconsistencies blocking academic history views.
*   **⚙️ API Stability (D1 SQL)**: Fixed parameter binding errors and synchronized SQL schema names.

### 🚀 [3.5.5] - 2026-04-28 (Security, Audit, and Advanced Search)
**"Bcrypt, History Categorization, and Pro Search"**

#### ✨ New Features and Improvements
*   **🔐 Password Security**: Migrated from plaintext to **Bcrypt hashes** with transparent auto-migration.
*   **🕵️ Refined Audit**: Prevent duplicate user registrations and intelligently categorize history logs.
*   **🔍 Pro Search**: Multi-criteria user filtering (by Role, Course, or Subject).
*   **⏳ Sliding Sessions**: 1-hour expiration with automatic token refresh to prevent inactive logouts.

### 🚀 [3.5.4] - 2026-04-28 (Dynamic Security Alerts)
#### ✨ New Features and Improvements
*   **🛡️ Improved Reset Protocol**: Implemented origin detection for admin-forced password resets, triggering mandatory security warnings upon login.

### 🚀 [3.5.3] - 2026-04-28 (Hybrid Roles and Session Stability)
#### ✨ New Features and Improvements
*   **🎭 Hybrid User Support (Teacher + Preceptor)**: Full refactoring to allow teachers with preceptor duties to manage their courses without role conflicts.
*   **🛠️ UI/UX Refinement**: Dynamic interfaces adapt to hybrid permissions automatically.

#### 🛠️ Patch Fixes
*   **Proactive Anti-Logout**: Eliminated 403 errors as a trigger for automatic logouts.

### 🚀 [3.5.2] - 2026-04-27 (Security Protocol)
#### ✨ New Features and Improvements
*   **🕵️ Audit Refactoring**: Granular privacy restrictions for system logs.
*   **🛡️ Mandatory Welcome Protocol**: Enforced password change upon first login with session-blocking persistence.

### 🚀 [3.5.1] - 2026-04-27 (Role Security)
#### ✨ New Features and Improvements
*   **👑 New Role: Head of Teachers**: Specialized access for scheduling and subject management.
*   **🛡️ Permissions Matrix Sync**: Strict read-only hardening for directive roles.
*   **🛡️ API Security**: Reinforced backend handlers to validate write permissions.

#### 🛠️ Patch Fixes
*   **DB Schema Update**: SQL migration to support new institutional roles.

### 🚀 [3.5.0] - 2026-04-27 (Multi-Sector Structure)
#### ✨ New Features and Improvements
*   **🏆 Multi-Sector Attendance**: Segmented tracking for Theory, Workshop, and Physical Education.
*   **🏹 Agile Course Navigation**: Quick-switch chevron arrows for seamless navigation.
*   **🖨️ Editorial Excellence**: Standardized break times and automated "Free Time" labels on printed schedules.

### 🚀 Previous Versions
*(For older version history, please refer to the Spanish README `README_es.md`)*

---
*Developed with ❤️ for the educational community.*
