# Thapar Transport Management System

Digital transport requisition and management system for Thapar Institute of Engineering & Technology.

## 🚀 Features

- Digital transport request submission
- Multi-level approval workflow
- Role-based access control
- Real-time notifications
- Vehicle assignment management
- Travel details tracking
- Excel export functionality
- Audit trail

## 👥 User Roles

- **User**: Submit transport requests
- **Head**: Approve/reject department requests
- **Admin**: Manage entire workflow, assign vehicles
- **Authority**: (Director/Deputy Director/Dean) Approve high-level requests
- **Registrar**: Final approval authority

## 🛠️ Tech Stack

### Frontend
- React 18
- Tailwind CSS
- React Router DOM
- Supabase Client
- Date-fns
- React Hot Toast
- Lucide React (Icons)

### Backend
- Node.js
- Express
- Supabase (PostgreSQL)
- Cloudinary (File Storage)
- PDFKit (PDF Generation)
- ExcelJS (Excel Export)

## 📁 Project Structure
```
thapar-transport-system/
├── client/          # React Frontend
└── server/          # Node.js Backend
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Cloudinary account

### Installation

1. **Clone the repository**
```bash
   git clone https://github.com/YOUR_USERNAME/thapar-transport-system.git
   cd thapar-transport-system
```

2. **Install Frontend Dependencies**
```bash
   cd client
   npm install
```

3. **Install Backend Dependencies**
```bash
   cd ../server
   npm install
```

4. **Setup Environment Variables**

   **Frontend (.env in client folder):**
```env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   REACT_APP_API_BASE_URL=http://localhost:5000/api
   REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
   REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

   **Backend (.env in server folder):**
```env
   PORT=5000
   NODE_ENV=development
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_role_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   CORS_ORIGIN=http://localhost:3000
```

5. **Setup Database**
   - Go to Supabase Dashboard
   - Run the SQL scripts from `database/schema.sql`

6. **Run Development Servers**

   **Terminal 1 - Frontend:**
```bash
   cd client
   npm start
```

   **Terminal 2 - Backend:**
```bash
   cd server
   npm run dev
```

7. **Access Application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## 📊 Database Schema

- `users` - User profiles and roles
- `transport_requests` - Transport requisition forms
- `approvals` - Approval history and audit trail
- `vehicles` - Vehicle master data
- `travel_details` - Post-travel information
- `notifications` - In-app notifications
- `predefined_heads` - Department heads list
- `rate_settings` - Transport rate configuration
- `attachments` - File uploads
- `audit_logs` - System audit trail

## 🔐 Security Features

- Row Level Security (RLS) in Supabase
- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Secure file uploads
- Audit logging

## 📝 Workflow

1. User submits transport request
2. Head approves/rejects
3. Admin reviews and routes to authority (if needed)
4. Authority approves/rejects
5. Admin forwards to Registrar
6. Registrar gives final approval
7. Admin assigns vehicle
8. Post-travel: Admin fills travel details
9. Request closed

## 🤝 Contributing

This is a university project. For contributions, please contact the development team.

## 📄 License

This project is for educational purposes only.

## 👨‍💻 Developer

Developed for Thapar Institute of Engineering & Technology

---

**Status**: 🚧 In Development

**Last Updated**: November 2025