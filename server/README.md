# 🚀 Thapar Transport Management System - Backend API

Node.js backend API for the Thapar Transport Management System. Provides PDF generation, Excel exports, file uploads, and analytics.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [File Upload](#file-upload)
- [Development](#development)
- [Deployment](#deployment)

---

## ✨ Features

- ✅ **PDF Generation** - Generate professional PDFs for transport requests
- ✅ **Excel Export** - Export requests, vehicles, and analytics to Excel
- ✅ **File Upload** - Upload attachments to Cloudinary with thumbnail generation
- ✅ **Analytics** - Dashboard statistics and vehicle utilization data
- ✅ **Authentication** - Supabase JWT token verification
- ✅ **Role-Based Access** - Different permissions for users, heads, admins, etc.
- ✅ **Rate Limiting** - Protect API from abuse
- ✅ **Error Handling** - Comprehensive error handling and logging
- ✅ **Security** - Helmet, CORS, input validation

---

## 🛠 Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL)
- **File Storage:** Cloudinary
- **PDF Generation:** PDFKit
- **Excel Generation:** ExcelJS
- **File Upload:** Multer + Sharp (image processing)
- **Logging:** Winston
- **Security:** Helmet, CORS, express-rate-limit

---

## 📦 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account and project
- Cloudinary account
- Access to the frontend `.env` for Supabase credentials

---

## 🚀 Installation

### 1. Navigate to server directory

```bash
cd server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

```bash
cp .env.example .env
```

### 4. Configure environment variables

Edit `.env` file with your credentials (see [Configuration](#configuration))

### 5. Start the server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start on `http://localhost:5000`

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,application/pdf

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Getting Credentials

**Supabase:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the `URL` and `anon public` key
4. Copy the `service_role` key (keep this secret!)

**Cloudinary:**
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret

---

## 📡 API Endpoints

### Base URL

```
http://localhost:5000/api/v1
```

### Health Check

```http
GET /api/v1/health
```

**Response:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2025-11-28T07:42:00.000Z"
}
```

---

### 📄 PDF Generation

#### Generate Request PDF

```http
GET /api/v1/export/pdf/request/:id
Authorization: Bearer {token}
```

**Parameters:**
- `id` - Transport request ID

**Response:**
- PDF file download

**Example:**
```bash
curl -X GET \
  'http://localhost:5000/api/v1/export/pdf/request/123' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  --output request.pdf
```

---

### 📊 Excel Export

#### Export Requests

```http
GET /api/v1/export/excel/requests
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional) - Filter by status
- `startDate` (optional) - Start date (YYYY-MM-DD)
- `endDate` (optional) - End date (YYYY-MM-DD)
- `department` (optional) - Filter by department

**Response:**
- Excel file download

**Example:**
```bash
curl -X GET \
  'http://localhost:5000/api/v1/export/excel/requests?status=approved&startDate=2025-01-01' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  --output requests.xlsx
```

#### Export Vehicles

```http
GET /api/v1/export/excel/vehicles
Authorization: Bearer {token}
```

**Permissions:** Admin only

**Response:**
- Excel file download

#### Export Analytics

```http
GET /api/v1/export/excel/analytics?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer {token}
```

**Query Parameters:**
- `startDate` (required) - Start date
- `endDate` (required) - End date

**Permissions:** Admin only

---

### 📤 File Upload

#### Upload Attachment

```http
POST /api/v1/upload/attachment
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body:**
- `file` - File to upload (max 5MB)
- `requestId` - Transport request ID

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "attachment": {
      "id": "uuid",
      "file_url": "https://res.cloudinary.com/...",
      "file_name": "document.pdf",
      "file_size": 102400
    },
    "thumbnail": {
      "url": "https://res.cloudinary.com/.../thumbnail"
    }
  }
}
```

**Example:**
```bash
curl -X POST \
  'http://localhost:5000/api/v1/upload/attachment' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'file=@/path/to/file.pdf' \
  -F 'requestId=123'
```

#### Get Attachments

```http
GET /api/v1/upload/attachments/:requestId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "file_url": "https://...",
      "file_name": "document.pdf",
      "created_at": "2025-11-28T07:42:00.000Z"
    }
  ]
}
```

#### Delete Attachment

```http
DELETE /api/v1/upload/attachment/:id
Authorization: Bearer {token}
```

---

### 📈 Analytics

#### Dashboard Analytics

```http
GET /api/v1/analytics/dashboard
Authorization: Bearer {token}
```

**Query Parameters:**
- `startDate` (optional) - Filter start date
- `endDate` (optional) - Filter end date

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 150,
    "pendingRequests": 20,
    "approvedRequests": 100,
    "completedRequests": 80,
    "rejectedRequests": 10,
    "totalAmount": 250000,
    "averageAmount": 3125,
    "requestsByDepartment": {
      "CSE": 50,
      "ECE": 40
    },
    "requestsByStatus": {
      "pending_head": 10,
      "approved": 90
    }
  }
}
```

#### Vehicle Analytics

```http
GET /api/v1/analytics/vehicles
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "vehicleNumber": "PB-01-AB-1234",
      "vehicleType": "car",
      "totalTrips": 45,
      "totalKm": 2500,
      "averageKmPerTrip": 55.5
    }
  ]
}
```

---

## 🔐 Authentication

All protected endpoints require a Supabase JWT token in the Authorization header:

```http
Authorization: Bearer {supabase_jwt_token}
```

### Getting a Token

The token is obtained from the frontend Supabase authentication. When a user logs in on the frontend, Supabase provides a JWT token that should be sent with API requests.

### Token Verification

The backend verifies tokens using Supabase's `getUser()` method and fetches the user's profile from the database.

---

## 👥 Role-Based Access Control

Different endpoints require different roles:

| Endpoint | Roles Allowed |
|----------|---------------|
| PDF Generation | All authenticated users |
| Excel Export (Requests) | Head, Admin, Authority, Registrar |
| Excel Export (Vehicles) | Admin only |
| Excel Export (Analytics) | Admin only |
| File Upload | All authenticated users |
| Analytics | Head, Admin, Authority, Registrar |

---

## 📁 File Upload

### Supported File Types

- Images: JPEG, PNG, JPG
- Documents: PDF

### File Size Limit

- Maximum: 5MB per file

### Image Processing

For image uploads:
- Original image is stored
- Thumbnail (200x200) is automatically generated
- Both URLs are returned in the response

### Storage

Files are stored in Cloudinary with the following structure:
```
transport-attachments/
  ├── original-files/
  └── thumbnails/
```

---

## 🛠 Development

### Project Structure

```
server/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   └── app.js            # Express app
├── logs/                 # Log files
├── .env                  # Environment variables
├── .env.example          # Environment template
├── package.json
└── README.md
```

### Running in Development

```bash
npm run dev
```

This uses `nodemon` for auto-restart on file changes.

### Logging

Logs are written to:
- Console (formatted, colorized)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)

### Testing API

Use tools like:
- **Postman** - Import the collection
- **cURL** - Command line requests
- **Thunder Client** - VS Code extension

---

## 🚀 Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure all environment variables
3. Ensure Supabase RLS policies are applied
4. Set up Cloudinary account

### Deployment Platforms

**Recommended:**
- **Railway** - Easy deployment, free tier
- **Render** - Simple setup
- **Heroku** - Classic choice
- **AWS/GCP** - Full control

### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Environment Variables

Set all `.env` variables in your deployment platform's dashboard.

### Health Check

Most platforms support health checks:
```
GET /api/v1/health
```

---

## 📊 Rate Limiting

API includes rate limiting to prevent abuse:

| Endpoint Type | Limit |
|---------------|-------|
| General API | 100 requests / 15 min |
| File Upload | 10 uploads / 15 min |
| PDF/Excel Export | 20 exports / 15 min |

---

## 🐛 Error Handling

All errors return a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400
  }
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized (no/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

---

## 🔧 Troubleshooting

### Server won't start

**Check:**
1. Node.js version (must be 18+)
2. All dependencies installed (`npm install`)
3. `.env` file exists and is configured
4. Port 5000 is not in use

### Authentication errors

**Check:**
1. Supabase credentials are correct
2. Token is being sent in Authorization header
3. Token format: `Bearer {token}`
4. User exists in Supabase

### File upload fails

**Check:**
1. Cloudinary credentials are correct
2. File size is under 5MB
3. File type is allowed (JPEG, PNG, PDF)
4. Request uses `multipart/form-data`

### PDF/Excel generation fails

**Check:**
1. Request ID exists in database
2. User has permission to access the request
3. All required data is present

---

## 📝 API Integration Example

### Frontend Integration (React)

```javascript
// Get Supabase token
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Download PDF
const downloadPDF = async (requestId) => {
  const response = await fetch(
    `http://localhost:5000/api/v1/export/pdf/request/${requestId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `request-${requestId}.pdf`;
  a.click();
};

// Upload file
const uploadFile = async (file, requestId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('requestId', requestId);

  const response = await fetch(
    'http://localhost:5000/api/v1/upload/attachment',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  );

  return await response.json();
};
```

---

## 🤝 Contributing

1. Follow existing code structure
2. Add error handling for all operations
3. Update documentation for new endpoints
4. Test thoroughly before committing

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🆘 Support

For issues or questions:
1. Check this README
2. Review error logs in `logs/` directory
3. Check Supabase and Cloudinary dashboards
4. Contact the development team

---

## 🎉 Success!

Your backend API is now ready to serve the Thapar Transport Management System!

**Next Steps:**
1. Start the server: `npm run dev`
2. Test health check: `http://localhost:5000/api/v1/health`
3. Integrate with frontend
4. Deploy to production

---

**Built with ❤️ for Thapar Institute of Engineering & Technology**
