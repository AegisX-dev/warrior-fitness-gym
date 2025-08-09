# WARRIOR FITNESS GYM

A comprehensive gym management system with separate interfaces for administrators and members. This RESTful API backend provides complete functionality for managing gym memberships, user accounts, and administrative operations.

## 🚀 Features

- **User Management**: Registration, login, profile management
- **Member Management**: Member registration, profile management, membership tracking
- **Admin Panel**: Complete administrative control over members and gym operations
- **Authentication**: JWT-based authentication with role-based access control
- **Password Security**: BCrypt encryption and password reset functionality
- **Membership Tracking**: Expiry dates, status management, and automatic notifications

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Password Encryption**: BCrypt
- **Validation**: Express Validator
- **CORS**: Cross-Origin Resource Sharing enabled

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## ⚙️ Installation

1. Clone the repository
```bash
git clone <repository-url>
cd warrior-fitness-gym
```

2. Navigate to backend directory
```bash
cd backend
```

3. Install dependencies
```bash
npm install
```

4. Create environment file
```bash
# Create .env file with the following variables:
JWT_SECRET=your-jwt-secret-key
MONGODB_URI=mongodb://localhost:27017/warrior-fitness-gym
PORT=3000
```

5. Start the server
```bash
npm start
```

The server will run on `http://localhost:3000`

## 🔧 Database Setup

Create an admin user by running:
```bash
node create-admin.js
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 👤 User Routes (`/api/users`)

### POST `/register`
Register a new user account
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### POST `/login`
User login
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### GET `/profile` 🔒
Get user profile (protected route)

### POST `/logout`
User logout

---

## 🏋️ Member Routes (`/api/members`)

### POST `/register`
Register a new gym member
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "membershipType": "premium"
}
```
- `membershipType`: "basic", "premium", or "vip" (default: "basic")

### POST `/login`
Member login
```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```

### GET `/profile` 🔒
Get member profile (protected route)

### PUT `/profile` 🔒
Update member profile
```json
{
  "name": "Jane Updated Name"
}
```

### POST `/forgot-password`
Request password reset
```json
{
  "email": "jane@example.com"
}
```

### POST `/reset-password/:token`
Reset password using token
```json
{
  "password": "newpassword123"
}
```

### POST `/change-password` 🔒
Change password (protected route)
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### POST `/logout`
Member logout

---

## 🛡️ Admin Routes (`/api/admin`)

### POST `/login`
Admin login
```json
{
  "email": "admin@gym.com",
  "password": "adminpassword"
}
```

### GET `/dashboard/stats` 🔒
Get dashboard statistics
- Total members
- Active/Inactive/Suspended members
- Membership types breakdown
- Expired memberships
- Expiring memberships

### GET `/members` 🔒
Get all members with pagination
- Query params: `page`, `limit`

### GET `/members/search` 🔒
Search members
- Query params: `query`, `membershipType`, `membershipStatus`

### GET `/members/expiring` 🔒
Get members with expiring memberships
- Query params: `days` (default: 30)

### GET `/members/:id` 🔒
Get specific member by ID

### POST `/members` 🔒
Create new member
```json
{
  "name": "New Member",
  "email": "newmember@example.com",
  "password": "password123",
  "membershipType": "basic",
  "membershipStatus": "active"
}
```

### PUT `/members/:id` 🔒
Update member details
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "membershipType": "premium",
  "membershipStatus": "active",
  "membershipExpiry": "2025-12-31"
}
```

### PUT `/members/:id/extend` 🔒
Extend member's membership
```json
{
  "months": 6
}
```

### DELETE `/members/:id` 🔒
Delete member

---

## 📊 Data Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Member Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  membershipType: String (basic/premium/vip),
  membershipStatus: String (active/inactive/suspended),
  joinDate: Date,
  membershipExpiry: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Authentication & Authorization

- **JWT Tokens**: 7-day expiry for users/members, 8-hour expiry for admins
- **Role-based Access**: Admin routes require admin role verification
- **Password Security**: BCrypt with 10 salt rounds
- **Token Types**: 
  - User tokens: `{ userId, type: undefined }`
  - Member tokens: `{ memberId, type: 'member' }`
  - Admin tokens: `{ userId, type: 'admin' }`

## 🚨 Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request / Validation Error
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

Error responses follow this format:
```json
{
  "message": "Error description",
  "errors": [/* validation errors if applicable */]
}
```

## 🔄 Status Codes & Responses

### Success Response Format
```json
{
  "message": "Operation successful",
  "data": {/* relevant data */}
}
```

### Error Response Format
```json
{
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

## 🧪 Testing

Test the API endpoints using tools like:
- Postman
- Insomnia
- cURL
- Thunder Client (VS Code extension)

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/warrior-fitness-gym

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Server
PORT=3000
```

## 📝 Notes

- All timestamps are in UTC
- Membership expiry is automatically set to 1 year from registration
- Password reset tokens expire after 1 hour
- Admin can extend memberships and manage all member data
- Members can only access and modify their own profiles

---

## 🚀 Getting Started

1. **Set up the environment** following the installation steps
2. **Create an admin user** using the create-admin script
3. **Test the endpoints** using your preferred API testing tool
4. **Build your frontend** to interact with these APIs

## 📞 Support

For support and queries, please refer to the API documentation above or check the source code for implementation details.

---

**Built with ❤️ for Warrior Fitness Gym**