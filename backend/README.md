# SmartWash Backend API

Backend server for the SmartWash Laundry Management System built with Node.js, Express, and MongoDB.

## Features

- JWT-based authentication
- Role-based access control (Student, Staff, Admin)
- RESTful API design
- MongoDB database with Mongoose ODM
- Password hashing with bcrypt
- CORS enabled
- Environment-based configuration

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Environment Variables**: dotenv

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   └── User.js              # User model with roles
│   ├── controllers/
│   │   └── auth.controller.js   # Authentication logic
│   ├── routes/
│   │   └── auth.routes.js       # Auth endpoints
│   ├── middleware/
│   │   └── auth.middleware.js   # JWT & role verification
│   ├── scripts/
│   │   └── seedAdmin.js         # Create admin user
│   └── server.js                # Main entry point
├── .env                         # Environment variables
├── .env.example                 # Example env file
└── package.json
```

## Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smartwash
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

## Create Admin User

Before testing, create an admin user:

```bash
npm run seed:admin
```

**Default Admin Credentials:**
- Email: `admin@smartwash.com`
- Password: `admin123`
- Role: `admin`

## API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/login` | Login user | Public |
| POST | `/api/auth/register` | Register new user | Public |
| GET | `/api/auth/me` | Get current user profile | Private |
| POST | `/api/auth/logout` | Logout user | Private |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| GET | `/` | API information |

## API Usage Examples

### 1. Login

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@smartwash.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "name": "Admin User",
    "email": "admin@smartwash.com",
    "role": "admin",
    "isActive": true
  }
}
```

### 2. Get Current User Profile

```bash
GET http://localhost:5000/api/auth/me
Authorization: Bearer YOUR_JWT_TOKEN
```

### 3. Register New User (Student)

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student",
  "hostelBlock": "A",
  "roomNumber": "101",
  "phoneNumber": "1234567890",
  "plan": {
    "totalWashes": 30
  }
}
```

## User Roles

| Role | Permissions |
|------|------------|
| **Student** | Submit laundry, track own bags, view wash count |
| **Staff** | View all bags, update bag status, manage operations |
| **Admin** | Full system access, user management, system settings |

## Middleware

### `protect` - Authentication Middleware
Verifies JWT token and attaches user to request object.

### `authorize(...roles)` - Role Authorization
Checks if user has required role(s).

**Helper Functions:**
- `isAdmin` - Admin only
- `isStaff` - Staff or Admin
- `isStudent` - Student only
- `isAdminOrStaff` - Admin or Staff

**Usage Example:**
```javascript
import { protect, isAdmin } from './middleware/auth.middleware.js';

router.get('/admin-only', protect, isAdmin, controller);
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/smartwash |
| JWT_SECRET | Secret key for JWT | - |
| JWT_EXPIRE | Token expiration | 7d |
| CLIENT_URL | Frontend URL for CORS | http://localhost:5173 |

## Error Handling

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (dev mode only)"
}
```

## Database Schema

### User Model

```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (student/staff/admin),
  hostelBlock: String (required for students),
  roomNumber: String (required for students),
  phoneNumber: String,
  plan: {
    totalWashes: Number,
    usedWashes: Number,
    remainingWashes: Number
  },
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Testing with Postman

1. Create a new collection "SmartWash API"
2. Import endpoints from examples above
3. Set environment variable for token after login
4. Test protected routes with Bearer token

## Next Steps

- [ ] Add laundry bag management endpoints
- [ ] Implement notification system
- [ ] Add real-time status updates
- [ ] Integrate AI chatbot service
- [ ] Add file upload for receipts/images
- [ ] Implement reporting endpoints

## Support

For issues or questions, refer to the main project README or contact the development team.
