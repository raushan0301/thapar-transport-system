# 📋 THAPAR TRANSPORT MANAGEMENT SYSTEM - DETAILED SOFTWARE REPORT
**Generated**: 26 March 2026
**Version**: 1.0.0
**Status**: In Development

---

## 📑 TABLE OF CONTENTS
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Frontend Pages & Routes](#frontend-pages--routes)
5. [Backend API Endpoints](#backend-api-endpoints)
6. [Database Schema](#database-schema)
7. [User Roles & Permissions](#user-roles--permissions)
8. [Components & Features](#components--features)
9. [Services & Utilities](#services--utilities)
10. [Security Features](#security-features)
11. [File Structure](#file-structure)

---

## PROJECT OVERVIEW

### Purpose
Digital transport requisition and management system for **Thapar Institute of Engineering & Technology** to streamline the process of requesting and assigning vehicles for department use.

### Key Features
- ✅ Digital transport request submission
- ✅ Multi-level approval workflow (Head → Admin → Authority → Registrar)
- ✅ Role-based access control (RBAC)
- ✅ Real-time notifications
- ✅ Vehicle assignment management
- ✅ Travel details tracking
- ✅ Excel/PDF export functionality
- ✅ Comprehensive audit trail
- ✅ Rate settings management
- ✅ User management dashboard

### Target Users
- **Students/Staff**: Submit transport requests
- **Department Heads**: Approve departmental requests
- **Admin**: Manage system, assign vehicles, post-travel processing
- **Authority**: Director/Deputy Director/Dean - High-level approval
- **Registrar**: Final approval authority

---

## ARCHITECTURE

### Architecture Type
**Full-Stack Monorepo with Microservices-Like Structure**

```
Client-Server Architecture
├── Frontend (React 19)
│   ├── State Management (Context API + NotificationContext)
│   ├── Authentication Context
│   └── UI Layer (Role-Based Dashboards)
│
└── Backend (Node.js + Express)
    ├── API Routes (v1)
    ├── Controllers
    ├── Services (PDF, Excel, Cloudinary)
    └── Middleware (Auth, RBAC, Rate Limiting)

Database: Supabase (PostgreSQL)
File Storage: Cloudinary
```

### Workflow Architecture

```
Request Submission Flow:
┌──────────────┐
│    USER      │ (Submit Request)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    HEAD      │ (Department Approval)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    ADMIN     │ (Route & Review)
└──────┬───────┘
       │
       ├─────────────────────────┐
       │                         │
       ▼                         ▼
   ┌────────┐            ┌──────────────┐
   │REGISTRAR│            │  AUTHORITY   │
   │(Direct) │            │(Director/DD) │
   └────────┘            └──────┬───────┘
       │                         │
       └──────────┬──────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ VEHICLE ASSIGNMENT  │
        │ BY ADMIN            │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ TRAVEL COMPLETION   │
        │ & CLOSURE           │
        └─────────────────────┘
```

---

## TECHNOLOGY STACK

### Frontend
| Technology | Purpose | Version |
|-----------|---------|---------|
| React | UI Framework | 19.2.0 |
| React Router DOM | Routing | 7.9.5 |
| Tailwind CSS | Styling | 3.4.10 |
| Supabase Client | Database Access | 2.80.0 |
| Axios | HTTP Client | 1.13.2 |
| React Hot Toast | Notifications | 2.6.0 |
| Lucide React | Icons | 0.553.0 |
| Date-fns | Date Formatting | 4.1.0 |

### Backend
| Technology | Purpose | Version |
|-----------|---------|---------|
| Node.js | Runtime | >=18.0.0 |
| Express | Web Framework | 4.18.2 |
| Supabase JS | Database Client | 2.39.0 |
| Cloudinary | Image Storage | 2.8.0 |
| PDFKit | PDF Generation | 0.13.0 |
| ExcelJS | Excel Export | 4.4.0 |
| Helmet | Security Headers | 7.2.0 |
| Morgan | HTTP Logging | 1.10.0 |
| Multer | File Upload | 1.4.5-lts.1 |
| Winston | Logging | 3.11.0 |
| Joi | Data Validation | 17.11.0 |
| express-rate-limit | Rate Limiting | 7.5.1 |

---

## FRONTEND PAGES & ROUTES

### 1. **Authentication Pages** (`/pages/auth/`)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/login` | Login.jsx | User login with email & password |
| `/register` | Register.jsx | New user registration |
| `/forgot-password` | ForgotPassword.jsx | Password reset flow |

### 2. **Landing & Shared Pages** (`/pages/shared/`, `/pages/`)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | LandingPage.jsx | Public landing page |
| `/profile` | Profile.jsx | User profile management |
| `/unauthorized` | Unauthorized.jsx | Access denied page |
| `*` | NotFound.jsx | 404 error page |

### 3. **Dashboard Router** (`/dashboard`)
Intelligent dashboard routing based on user role:
- **USER** → UserDashboard
- **HEAD** → HeadDashboard
- **ADMIN** → AdminDashboard
- **DIRECTOR/DEPUTY_DIRECTOR/DEAN** → AuthorityDashboard
- **REGISTRAR** → RegistrarDashboard

### 4. **User Pages** (`/pages/user/`)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | UserDashboard.jsx | User overview & quick actions |
| `/new-request` | NewRequest.jsx | Create new transport request |
| `/my-requests` | MyRequests.jsx | View all user's requests |
| `/request/:id` | RequestDetails.jsx | View request details |
| `/edit-request/:id` | EditRequest.jsx | Edit pending request |

### 5. **Head Pages** (`/pages/head/`)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | HeadDashboard.jsx | Head's dashboard overview |
| `/head/pending` | PendingApprovals.jsx | Pending requests for approval |
| `/head/review/:id` | ReviewRequest.jsx | Review & approve/reject request |
| `/head/history` | ApprovalHistory.jsx | Approval history log |

### 6. **Admin Pages** (`/pages/admin/`)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | AdminDashboard.jsx | Admin overview panel |
| `/admin/pending` | PendingReview.jsx | Requests awaiting admin review |
| `/admin/review/:id` | ReviewRequest.jsx | Review & route requests |
| `/admin/vehicle-assignment` | VehicleAssignment.jsx | Assign vehicles to approved requests |
| `/admin/travel-completion` | TravelCompletion.jsx | Record travel completion details |
| `/admin/vehicles` | VehicleManagement.jsx | Manage vehicle master data |
| `/admin/heads` | HeadManagement.jsx | Manage department heads |
| `/admin/users` | UserManagement.jsx | Manage users & roles |
| `/admin/rates` | RateSettings.jsx | Configure transport rates |
| `/admin/export` | ExportData.jsx | Export requests to Excel |
| `/admin/audit` | AuditLogs.jsx | View system audit logs |

### 7. **Authority Pages** (`/pages/authority/`)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | AuthorityDashboard.jsx | Authority's dashboard |
| `/authority/pending` | PendingApprovals.jsx | Pending approvals for authority |
| `/authority/review/:id` | ReviewRequest.jsx | Review & approve/reject |
| `/authority/history` | ApprovalHistory.jsx | Approval history |

### 8. **Registrar Pages** (`/pages/registrar/`)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | RegistrarDashboard.jsx | Registrar dashboard |
| `/registrar/pending` | PendingApprovals.jsx | Pending registrar approvals |
| `/registrar/history` | ApprovalHistory.jsx | Approval history |

### 9. **Debug Pages** (`/pages/debug/`)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/debug/head-approval` | DebugHeadApproval.jsx | Development debugging page |

---

## BACKEND API ENDPOINTS

### Base URL: `/api/v1`

### 1. **Health Check**
```
GET /health
Response: { success, message, timestamp }
```

### 2. **Export Routes** (`/export`)
```
GET  /export/pdf/request/:id          - Generate PDF for a request
GET  /export/excel/requests           - Export requests to Excel
GET  /export/excel/requests?filters   - Export with filters
```

### 3. **Upload Routes** (`/upload`)
```
POST /upload/attachment               - Upload attachment file
```
Supported: Images, PDFs (via Cloudinary)

### 4. **Analytics Routes** (`/analytics`)
```
GET  /analytics/dashboard             - Get dashboard analytics
GET  /analytics/dashboard?period=month - Period-specific analytics
```

### 5. **Root Endpoint**
```
GET /
Response: API info, version, available endpoints
```

---

## DATABASE SCHEMA

### Core Tables

#### 1. **users**
```sql
- id (UUID, Primary Key)
- email (VARCHAR, Unique)
- name (VARCHAR)
- role (ENUM: user, head, admin, director, deputy_director, dean, registrar)
- department (VARCHAR)
- phone (VARCHAR)
- employee_id (VARCHAR, Unique)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2. **transport_requests**
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users)
- title (VARCHAR)
- from_location (VARCHAR)
- to_location (VARCHAR)
- requested_date (DATE)
- no_of_persons (INTEGER)
- purpose (TEXT)
- status (ENUM: pending, head_approved, admin_approved, authority_approved, registrar_approved, rejected, cancelled)
- priority (ENUM: normal, high, urgent)
- budget_code (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3. **approvals**
```sql
- id (UUID, Primary Key)
- request_id (UUID, Foreign Key → transport_requests)
- approver_id (UUID, Foreign Key → users)
- approval_level (ENUM: head, admin, authority, registrar)
- status (ENUM: pending, approved, rejected)
- comments (TEXT)
- approved_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

#### 4. **vehicles**
```sql
- id (UUID, Primary Key)
- registration_number (VARCHAR, Unique)
- vehicle_type (VARCHAR)
- capacity (INTEGER)
- status (ENUM: active, inactive, maintenance)
- driver_name (VARCHAR)
- driver_phone (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 5. **travel_details**
```sql
- id (UUID, Primary Key)
- request_id (UUID, Foreign Key → transport_requests)
- vehicle_id (UUID, Foreign Key → vehicles)
- actual_date (DATE)
- start_time (TIME)
- end_time (TIME)
- kilometers (DECIMAL)
- fuel_used (DECIMAL)
- notes (TEXT)
- verified_by (UUID, Foreign Key → users)
- created_at (TIMESTAMP)
```

#### 6. **notifications**
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users)
- title (VARCHAR)
- message (TEXT)
- type (ENUM: info, success, warning, error)
- read (BOOLEAN)
- created_at (TIMESTAMP)
```

#### 7. **predefined_heads**
```sql
- id (UUID, Primary Key)
- department_name (VARCHAR)
- head_email (VARCHAR)
- head_name (VARCHAR)
- created_at (TIMESTAMP)
```

#### 8. **rate_settings**
```sql
- id (UUID, Primary Key)
- rate_type (VARCHAR)
- rate_per_km (DECIMAL)
- rate_per_hour (DECIMAL)
- active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 9. **attachments**
```sql
- id (UUID, Primary Key)
- request_id (UUID, Foreign Key → transport_requests)
- file_name (VARCHAR)
- file_url (VARCHAR) - Cloudinary URL
- file_size (INTEGER)
- uploaded_by (UUID, Foreign Key → users)
- created_at (TIMESTAMP)
```

#### 10. **audit_logs**
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users)
- action (VARCHAR)
- entity_type (VARCHAR)
- entity_id (VARCHAR)
- changes (JSONB) - Before/after comparison
- ip_address (VARCHAR)
- user_agent (VARCHAR)
- created_at (TIMESTAMP)
```

---

## USER ROLES & PERMISSIONS

### 1. **USER (Regular User)**
**Permissions:**
- Submit new transport requests
- View own requests and approval status
- Edit pending requests (before head approval)
- View request history
- Receive notifications

**Cannot:**
- Approve requests
- Assign vehicles
- View other users' requests
- Access admin features

### 2. **HEAD (Department Head)**
**Permissions:**
- View requests from department members
- Approve/reject department requests
- Add comments to requests
- View approval history
- Submit own requests

**Cannot:**
- Assign vehicles
- Manage rates
- Access admin panel
- Approve requests outside department

### 3. **ADMIN**
**Permissions:**
- View all requests across departments
- Review & route requests to authority
- Assign vehicles to approved requests
- Record travel completion details
- Manage vehicles master data
- Manage users & roles
- Manage department heads
- Configure rate settings
- Export data (Excel/PDF)
- View audit logs
- Send system notifications

**Cannot:**
- Approve requests (review only - route to authority)
- Edit user profiles
- Delete historical data

### 4. **AUTHORITY (Director/Deputy Director/Dean)**
**Permissions:**
- Approve/reject requests routed by admin
- View requests from their authority level
- Add comments to requests
- View approval history
- Submit own requests

**Cannot:**
- Assign vehicles
- Manage system settings
- Access lower-level approvals
- Manage users

### 5. **REGISTRAR**
**Permissions:**
- Final approval of requests
- View all requests in system
- Approve/reject at registrar level
- Add comments
- View complete approval history
- Submit own requests

**Cannot:**
- Assign vehicles
- Manage system settings
- Modify approved requests

---

## COMPONENTS & FEATURES

### Core Components Structure

#### Layout Components (`/components/layout/`)
- **Navbar.jsx** - Top navigation bar with user menu
- **Sidebar.jsx** - Primary navigation sidebar
- **DashboardLayout.jsx** - Consistent dashboard wrapper
- **Footer.jsx** - Footer component

#### Common Components (`/components/common/`)
- **Button.jsx** - Reusable button component
- **Card.jsx** - Card container component
- **Input.jsx** - Text input field
- **Textarea.jsx** - Multi-line text input
- **Select.jsx** - Dropdown select component
- **Modal.jsx** - Modal dialog component
- **Table.jsx** - Data table with sorting/filtering
- **Badge.jsx** - Status/category badges
- **Loader.jsx** - Loading spinner
- **Avatar.jsx** - User avatar display
- **StatisticsCards.jsx** - Dashboard stats display
- **FilterBar.jsx** - Advanced filtering UI
- **ExportButton.jsx** - Export action button

#### Form Components (`/components/forms/`)
- **HeadSelector.jsx** - Department head selection
- **FileUpload.jsx** - File upload with preview

#### Approval Components (`/components/approvals/`)
- Approval workflow components
- Approval status display

#### Timeline Components (`/components/timeline/`)
- Request approval timeline visualization

#### Notification Components (`/components/notifications/`)
- **NotificationBell.jsx** - Bell icon with count
- **NotificationPanel.jsx** - Dropdown notification panel
- **NotificationItem.jsx** - Individual notification

### Feature Highlights

#### 1. **Multi-Level Approval Workflow**
- Sequential approval process
- Automatic routing based on request type
- Approval commenting & audit trail
- Status tracking at each level

#### 2. **Real-Time Notifications**
- In-app toast notifications
- Notification panel with history
- Different notification types (info, success, warning, error)
- Mark as read functionality

#### 3. **Vehicle Management**
- Add/edit/delete vehicles
- Track vehicle availability
- Driver information
- Vehicle status (active, inactive, maintenance)

#### 4. **Travel Tracking**
- Record completion details post-travel
- Distance & fuel tracking
- Travel cost calculation
- Verification by admin

#### 5. **Data Export**
- Excel export with filtering
- PDF generation for individual requests
- Custom date range exports

#### 6. **User Management**
- Create/edit/deactivate users
- Role assignment
- Department assignment
- Email communication tracking

#### 7. **Rate Settings**
- Configure transport rates
- Rate per kilometer
- Rate per hour
- Multiple rate types

---

## SERVICES & UTILITIES

### Backend Services (`/server/src/services/`)

#### 1. **pdfService.js**
- Generate PDF for transport requests
- Custom headers and footers
- Request details formatting
- Export to file or stream

#### 2. **excelService.js**
- Export requests to Excel spreadsheet
- Multiple sheets (requests, approvals, vehicles)
- Formatting and styling
- Filter support

#### 3. **cloudinaryService.js**
- Image upload handling
- File storage management
- URL generation
- File deletion

### Frontend Services (`/client/src/services/`)
- API communication services
- Supabase client initialization
- Authentication services
- Data fetching utilities

### Utilities

#### Backend (`/server/src/utils/`)
- **logger.js** - Winston logging configuration
- **responseFormatter.js** - Standardized API responses
- **errorTypes.js** - Custom error definitions

#### Frontend (`/client/src/utils/`)
- **constants.js** - Application constants & roles
- **validators.js** - Form validation functions
- **formatters.js** - Date/currency formatting

### Middleware (`/server/src/middleware/`)

#### 1. **auth.js**
- JWT token verification
- User authentication validation
- Token extraction from headers

#### 2. **roleCheck.js**
- Role-based access control (RBAC)
- Permission validation
- Route protection

#### 3. **errorHandler.js**
- Global error handling
- Error response formatting
- Status code mapping

#### 4. **rateLimiter.js**
- API rate limiting
- Prevent abuse
- Configurable limits per endpoint

---

## SECURITY FEATURES

### 1. **Authentication & Authorization**
- JWT-based authentication via Supabase
- Row Level Security (RLS) policies
- Token validation on each request
- Secure password handling

### 2. **Access Control**
- Role-based access control (RBAC)
- Route protection with PrivateRoute component
- Role-specific route access via RoleRoute component
- Request-level authorization checks

### 3. **Data Protection**
- HTTPS/TLS in production
- Data encryption at rest (Supabase managed)
- Secure file storage via Cloudinary
- Input validation with Joi schema

### 4. **Network Security**
- CORS configuration restricted to frontend domain
- Helmet.js for security headers
- Express rate limiting
- Morgan HTTP logging

### 5. **Audit & Logging**
- Comprehensive audit trail with audit_logs table
- User action tracking
- Request/response logging
- Winston logging system

### 6. **File Upload Security**
- File type validation
- File size limits (10MB)
- Malware scanning via Cloudinary
- Secure URLs with token expiration

### 7. **Input Validation**
- Joi schema validation on backend
- Client-side validation on frontend
- SQL injection prevention via ORM
- XSS prevention via React

---

## FILE STRUCTURE

```
thapar-transport-system/
├── client/                              # React Frontend (Port 3000)
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── components/
│   │   │   ├── layout/                  # Layout wrappers
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── DashboardLayout.jsx
│   │   │   │   └── Footer.jsx
│   │   │   ├── common/                  # Reusable components
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Table.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Loader.jsx
│   │   │   │   ├── Avatar.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── StatisticsCards.jsx
│   │   │   │   ├── FilterBar.jsx
│   │   │   │   └── ExportButton.jsx
│   │   │   ├── forms/                   # Form components
│   │   │   │   ├── HeadSelector.jsx
│   │   │   │   └── FileUpload.jsx
│   │   │   ├── approvals/               # Approval workflow
│   │   │   ├── timeline/                # Timeline visualization
│   │   │   └── notifications/           # Notification system
│   │   │       ├── NotificationBell.jsx
│   │   │       ├── NotificationPanel.jsx
│   │   │       └── NotificationItem.jsx
│   │   ├── pages/
│   │   │   ├── auth/                    # Authentication pages
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   └── ForgotPassword.jsx
│   │   │   ├── user/                    # User dashboard & pages
│   │   │   │   ├── UserDashboard.jsx
│   │   │   │   ├── NewRequest.jsx
│   │   │   │   ├── MyRequests.jsx
│   │   │   │   ├── RequestDetails.jsx
│   │   │   │   └── EditRequest.jsx
│   │   │   ├── head/                    # Head approval pages
│   │   │   │   ├── HeadDashboard.jsx
│   │   │   │   ├── PendingApprovals.jsx
│   │   │   │   ├── ReviewRequest.jsx
│   │   │   │   └── ApprovalHistory.jsx
│   │   │   ├── admin/                   # Admin management pages
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── PendingReview.jsx
│   │   │   │   ├── ReviewRequest.jsx
│   │   │   │   ├── VehicleAssignment.jsx
│   │   │   │   ├── TravelCompletion.jsx
│   │   │   │   ├── VehicleManagement.jsx
│   │   │   │   ├── HeadManagement.jsx
│   │   │   │   ├── UserManagement.jsx
│   │   │   │   ├── RateSettings.jsx
│   │   │   │   ├── ExportData.jsx
│   │   │   │   └── AuditLogs.jsx
│   │   │   ├── authority/               # Authority approval pages
│   │   │   │   ├── AuthorityDashboard.jsx
│   │   │   │   ├── PendingApprovals.jsx
│   │   │   │   ├── ReviewRequest.jsx
│   │   │   │   └── ApprovalHistory.jsx
│   │   │   ├── registrar/               # Registrar pages
│   │   │   │   ├── RegistrarDashboard.jsx
│   │   │   │   ├── PendingApprovals.jsx
│   │   │   │   └── ApprovalHistory.jsx
│   │   │   ├── shared/                  # Shared pages
│   │   │   │   ├── Profile.jsx
│   │   │   │   ├── NotFound.jsx
│   │   │   │   └── Unauthorized.jsx
│   │   │   ├── debug/                   # Debug pages
│   │   │   │   └── DebugHeadApproval.jsx
│   │   │   └── LandingPage.jsx          # Public landing
│   │   ├── routes/
│   │   │   ├── AppRoutes.jsx            # Main routing config
│   │   │   ├── PrivateRoute.jsx         # Auth protection
│   │   │   └── RoleRoute.jsx            # Role protection
│   │   ├── context/                     # React contexts
│   │   │   ├── AuthContext.jsx          # Auth state management
│   │   │   └── NotificationContext.jsx  # Notifications state
│   │   ├── hooks/                       # Custom React hooks
│   │   ├── services/                    # API & Supabase services
│   │   ├── utils/                       # Utility functions
│   │   ├── styles/                      # Global styles
│   │   └── index.css                    # Tailwind imports
│   └── package.json
│
├── server/                               # Node.js Backend (Port 5000)
│   ├── src/
│   │   ├── app.js                        # Express app setup
│   │   ├── config/
│   │   │   ├── constants.js              # Environment config
│   │   │   ├── database.js               # Supabase config
│   │   │   └── cloudinary.js             # Cloudinary config
│   │   ├── middleware/
│   │   │   ├── auth.js                   # JWT validation
│   │   │   ├── roleCheck.js              # RBAC check
│   │   │   ├── errorHandler.js           # Error handling
│   │   │   └── rateLimiter.js            # Rate limiting
│   │   ├── routes/
│   │   │   ├── index.js                  # Route aggregation
│   │   │   ├── exportRoutes.js           # PDF/Excel export
│   │   │   ├── uploadRoutes.js           # File upload
│   │   │   └── analyticsRoutes.js        # Analytics data
│   │   ├── controllers/
│   │   │   ├── exportController.js       # Export logic
│   │   │   ├── uploadController.js       # Upload logic
│   │   │   └── analyticsController.js    # Analytics logic
│   │   ├── services/
│   │   │   ├── pdfService.js             # PDF generation
│   │   │   ├── excelService.js           # Excel export
│   │   │   └── cloudinaryService.js      # File storage
│   │   └── utils/
│   │       ├── logger.js                 # Winston logger
│   │       ├── responseFormatter.js      # API response format
│   │       └── errorTypes.js             # Error definitions
│   └── package.json
│
├── database/
│   ├── migrations/                       # Database schema migrations
│   │   ├── SUMMARY.md
│   │   ├── QUICKSTART.md
│   │   ├── README.md
│   │   └── *.sql                         # Individual migration files
│   └── schema.sql                        # Complete schema
│
├── .env.example                          # Environment template
├── .gitignore                            # Git ignore config
├── README.md                             # Project README
├── QUICK-REFERENCE.md                    # Quick start guide
├── FULLSTACK-COMPLETE.md                 # Completion status
├── SYSTEM-STATUS-REPORT.md               # System status
└── DETAILED-SOFTWARE-REPORT.md           # This file

```

---

## WORKFLOW SUMMARY

### Complete Request Lifecycle

```
1. USER SUBMISSION
   └─→ Create new request
   └─→ Fill transport details
   └─→ Upload attachments
   └─→ Submit for approval

2. HEAD APPROVAL
   └─→ Head reviews request
   └─→ Add comments if needed
   └─→ Approve/Reject
   └─→ Status: head_approved/rejected

3. ADMIN REVIEW
   └─→ Admin reviews all pending
   └─→ Validate request details
   ├─→ Route to Authority (if needed)
   └─→ Status: admin_approved/authority_pending

4. AUTHORITY APPROVAL (if required)
   └─→ Director/Deputy Director/Dean reviews
   └─→ Add comments
   └─→ Approve/Reject
   └─→ Status: authority_approved/rejected

5. REGISTRAR APPROVAL
   └─→ Registrar gives final approval
   └─→ Status: registrar_approved

6. VEHICLE ASSIGNMENT
   └─→ Admin assigns vehicle
   └─→ Generate transport pass
   └─→ Notify user

7. TRAVEL COMPLETION
   └─→ Admin records travel details
   └─→ Distance, fuel, time
   └─→ Status: completed

8. CLOSURE
   └─→ Request archived
   └─→ Audit trail maintained
```

---

## KEY STATISTICS

- **Total Pages**: 35+ pages
- **Components**: 25+ reusable components
- **User Roles**: 7 distinct roles
- **Database Tables**: 10+ core tables
- **API Endpoints**: 6+ endpoint groups
- **Middleware**: 4 core middleware functions
- **Services**: 3 backend services

---

## DEVELOPMENT NOTES

### Current Features
- ✅ Full authentication system
- ✅ Role-based access control
- ✅ Multi-level approval workflow
- ✅ Vehicle management
- ✅ PDF/Excel export
- ✅ Real-time notifications
- ✅ Audit logging
- ✅ Rate configuration

### Planned/In Progress
- 🔄 Mobile responsive improvements
- 🔄 Advanced analytics dashboard
- 🔄 SMS notifications
- 🔄 Integration with external systems

### Known Debug Pages
- `/debug/head-approval` - For debugging head approval workflow

---

## NEXT STEPS

This report provides a comprehensive overview of the Thapar Transport Management System. You can now:

1. **Request to add new pages/features**
2. **Request to remove/deprecate pages/features**
3. **Request to modify existing functionality**
4. **Request database schema changes**

Please provide specific instructions for modifications.

---

**Generated**: 26 March 2026
**Report Version**: 1.0
**Status**: Complete
