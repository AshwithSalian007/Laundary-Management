# SmartWash - AI-Enabled Laundry Management System
## Project Roadmap & Structure Guide

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture Overview](#system-architecture-overview)
3. [Technology Stack Summary](#technology-stack-summary)
4. [Project Structure](#project-structure)
5. [Development Phases](#development-phases)
6. [File Organization](#file-organization)
7. [Feature Implementation Order](#feature-implementation-order)
8. [Database Planning](#database-planning)
9. [API Endpoints Structure](#api-endpoints-structure)
10. [Testing Approach](#testing-approach)
11. [Deployment Strategy](#deployment-strategy)
12. [6-Week Timeline](#6-week-timeline)

---

## 1. Project Overview

### What You're Building
A complete laundry management system with:
- **Mobile App** for students (React Native)
- **Web Portal** for staff (React.js)
- **Backend Server** (Node.js + Express)
- **AI Chatbot** (Python Flask + Gemini API)
- **Database** (MongoDB)

### Core Features (MVP)
1. User authentication (login/register)
2. Laundry request submission
3. Real-time status tracking
4. Wash count management
5. AI chatbot for queries
6. Staff dashboard for management

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   USER LAYER                        │
│  - Students (Mobile App)                            │
│  - Staff/Admin (Web Portal)                         │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ (HTTP/REST API)
                   │
┌──────────────────▼──────────────────────────────────┐
│               APPLICATION LAYER                      │
│  - Backend API Server (Node.js + Express)           │
│  - AI Service (Python Flask)                        │
│  - Authentication (JWT)                             │
└──────────────────┬──────────────────────────────────┘
                   │
                   │
┌──────────────────▼──────────────────────────────────┐
│                 DATA LAYER                          │
│  - MongoDB Database                                 │
│  - Collections: users, laundryBags, notifications   │
└─────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack Summary

### Frontend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Mobile App | React Native + Expo | Student interface |
| Web Portal | React.js | Staff/Admin interface |
| UI Library | React Native Paper (mobile), Material-UI (web) | Pre-built components |

### Backend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| API Server | Node.js + Express.js | Handle all requests |
| Authentication | JWT (jsonwebtoken) | Secure login |
| Database ODM | Mongoose | MongoDB interaction |

### Database
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Database | MongoDB | Store all data |
| Hosting | MongoDB Atlas (Free) | Cloud database |

### AI Module
| Component | Technology | Purpose |
|-----------|-----------|---------|
| AI Service | Python Flask | API for AI features |
| Chatbot | Google Gemini API (Free) | Answer student queries |

---

## 4. Project Structure

### Root Directory Layout
```
smartwash-laundry/
│
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── models/            # Database schemas
│   │   ├── routes/            # API endpoints
│   │   ├── controllers/       # Business logic
│   │   ├── middleware/        # Auth, validation
│   │   ├── config/            # Database connection
│   │   └── server.js          # Main entry file
│   ├── .env                   # Environment variables
│   └── package.json
│
├── mobile-app/                # React Native student app
│   └── smartwash-student/
│       ├── src/
│       │   ├── screens/       # App screens
│       │   ├── components/    # Reusable components
│       │   ├── services/      # API calls
│       │   ├── context/       # State management
│       │   └── navigation/    # Screen routing
│       └── App.js
│
├── web-portal/                # React.js staff portal
│   └── smartwash-admin/
│       ├── src/
│       │   ├── pages/         # Web pages
│       │   ├── components/    # Reusable components
│       │   └── services/      # API calls
│       └── package.json
│
├── ai-service/                # Python Flask AI service
│   ├── app.py                 # Main Flask app
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # API keys
│
└── docs/                      # Documentation
    ├── API_DOCUMENTATION.md
    └── USER_MANUAL.md
```

---

## 5. Development Phases

### Phase 1: Environment Setup (Week 1)
**Goal:** Get all tools installed and project initialized

**Steps:**
1. Install Node.js, Python, MongoDB
2. Create folder structure
3. Initialize projects (npm init, expo init)
4. Set up Git repository
5. Get Gemini API key
6. Create MongoDB Atlas account

**Deliverables:**
- All folders created
- package.json files ready
- Development tools installed
- Database connection string obtained

---

### Phase 2: Database & Backend Foundation (Week 2)
**Goal:** Build the API server with authentication

**Steps:**
1. Design database schema (users, laundryBags)
2. Create Mongoose models
3. Build authentication system (register, login)
4. Create user management APIs
5. Test APIs with Postman

**Deliverables:**
- Working authentication
- User CRUD operations
- API tested and documented

**Key Files to Create:**
- `backend/src/models/User.js`
- `backend/src/models/LaundryBag.js`
- `backend/src/routes/auth.routes.js`
- `backend/src/controllers/auth.controller.js`
- `backend/src/middleware/auth.middleware.js`

---

### Phase 3: Backend - Laundry Management (Week 2-3)
**Goal:** Build laundry tracking APIs

**Steps:**
1. Create laundry submission endpoint
2. Build status tracking system
3. Implement wash count logic
4. Create APIs for staff to update status
5. Add filtering and sorting

**Deliverables:**
- Complete laundry CRUD APIs
- Status update system
- Wash count management

**Key Files to Create:**
- `backend/src/routes/laundry.routes.js`
- `backend/src/controllers/laundry.controller.js`

---

### Phase 4: Mobile App Development (Week 3)
**Goal:** Build student mobile interface

**Steps:**
1. Set up navigation structure
2. Create login/register screens
3. Build home dashboard
4. Implement laundry submission form
5. Create bag tracking screen
6. Connect to backend APIs

**Deliverables:**
- Working mobile app
- All screens functional
- API integration complete

**Key Screens:**
1. Login Screen
2. Register Screen
3. Home Dashboard (shows wash count)
4. Submit Laundry Screen
5. My Bags Screen (list view)
6. Bag Detail Screen (status timeline)

---

### Phase 5: Web Portal Development (Week 3-4)
**Goal:** Build staff management interface

**Steps:**
1. Create login page
2. Build dashboard with statistics
3. Create bag management table
4. Implement status update functionality
5. Add filtering and search
6. Connect to backend APIs

**Deliverables:**
- Working web portal
- Staff can manage all bags
- Real-time updates

**Key Pages:**
1. Login Page
2. Dashboard (statistics cards)
3. Bag Management Page (table view)
4. Bag Detail Page (update status)

---

### Phase 6: AI Chatbot Integration (Week 4)
**Goal:** Add intelligent chatbot

**Steps:**
1. Set up Python Flask service
2. Integrate Gemini API
3. Create chat endpoint
4. Build chat UI in mobile app
5. Connect chatbot to backend for context
6. Test conversation flow

**Deliverables:**
- Working AI chatbot
- Integrated in mobile app
- Context-aware responses

**What Chatbot Does:**
- Answer laundry-related questions
- Provide wash count information
- Explain laundry status
- Give general assistance

---

### Phase 7: Testing & Bug Fixes (Week 5)
**Goal:** Ensure everything works correctly

**Testing Areas:**
1. **Unit Testing:** Test individual functions
2. **API Testing:** Test all endpoints with Postman
3. **Integration Testing:** Test complete flows
4. **User Testing:** Test mobile app with real users
5. **Security Testing:** Check authentication vulnerabilities

**Common Issues to Check:**
- Password hashing works
- JWT tokens expire correctly
- Only students see their own bags
- Staff can update any bag
- Wash count decrements properly
- API errors handled gracefully

---

### Phase 8: Deployment & Documentation (Week 6)
**Goal:** Make the system live and documented

**Steps:**
1. Deploy backend to Render/Railway
2. Deploy AI service to cloud
3. Configure MongoDB Atlas
4. Build mobile app APK
5. Write API documentation
6. Create user manual
7. Prepare presentation

**Deliverables:**
- Live backend API
- Downloadable mobile app
- Complete documentation
- Demo video

---

## 6. File Organization

### Backend Files (What Each File Does)

```
backend/src/
│
├── server.js                  → Main entry point, starts server
├── config/
│   └── database.js           → MongoDB connection setup
│
├── models/
│   ├── User.js               → User schema (name, email, password, wash count)
│   ├── LaundryBag.js         → Laundry bag schema (status, student info)
│   └── Notification.js       → Notification schema (optional)
│
├── routes/
│   ├── auth.routes.js        → Routes for login/register
│   ├── user.routes.js        → Routes for user management
│   └── laundry.routes.js     → Routes for laundry operations
│
├── controllers/
│   ├── auth.controller.js    → Login/register logic
│   ├── user.controller.js    → User CRUD logic
│   └── laundry.controller.js → Laundry management logic
│
└── middleware/
    └── auth.middleware.js    → JWT verification, role checking
```

### Mobile App Files (What Each File Does)

```
mobile-app/src/
│
├── App.js                     → Main app entry
├── navigation/
│   └── AppNavigator.js       → Screen navigation setup
│
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.js    → Login form
│   │   └── RegisterScreen.js → Registration form
│   ├── home/
│   │   ├── HomeScreen.js     → Dashboard (wash count, active bags)
│   │   └── SubmitLaundryScreen.js → Form to submit new request
│   ├── laundry/
│   │   ├── MyBagsScreen.js   → List of all bags
│   │   └── BagDetailScreen.js → Track individual bag status
│   └── chat/
│       └── ChatbotScreen.js  → AI chatbot interface
│
├── components/
│   ├── BagCard.js            → Reusable bag display component
│   └── StatusBadge.js        → Status display component
│
├── services/
│   ├── api.js                → Axios setup, API base URL
│   ├── auth.service.js       → Login/register API calls
│   └── laundry.service.js    → Laundry API calls
│
└── context/
    └── AuthContext.js        → Global user state management
```

### Web Portal Files (What Each File Does)

```
web-portal/src/
│
├── App.js                     → Main app entry
├── pages/
│   ├── Login.js              → Staff login page
│   ├── Dashboard.js          → Statistics overview
│   ├── BagManagement.js      → Table of all bags
│   └── BagDetail.js          → Update bag status
│
├── components/
│   ├── Navbar.js             → Top navigation bar
│   ├── BagTable.js           → Reusable table component
│   └── StatusUpdateModal.js  → Popup to change status
│
└── services/
    └── api.js                → API calls
```

---

## 7. Feature Implementation Order

### Priority 1: Core Authentication (Week 2)
1. User registration
2. User login
3. JWT token generation
4. Protected routes

### Priority 2: Basic Laundry Flow (Week 2-3)
1. Submit laundry request
2. View my laundry bags
3. View bag details
4. Staff can see all bags

### Priority 3: Status Management (Week 3)
1. Staff can update bag status
2. Students see updated status
3. Status history tracking
4. Wash count deduction on completion

### Priority 4: Mobile UI (Week 3)
1. Login/register screens
2. Home dashboard
3. Submit laundry form
4. Bag list and details

### Priority 5: Web Portal (Week 3-4)
1. Staff login
2. Dashboard with stats
3. Bag management table
4. Status update functionality

### Priority 6: AI Chatbot (Week 4)
1. Flask service setup
2. Gemini API integration
3. Chat UI in mobile app
4. Context-aware responses

### Priority 7: Enhancements (Week 5)
1. Real-time notifications
2. Search and filters
3. Error handling
4. Loading states

---

## 8. Database Planning

### Collections You Need

#### 1. users Collection
**Stores:** Student and staff information
**Fields:**
- name, email, password (hashed)
- role (student/staff/admin)
- hostelBlock, roomNumber
- plan (totalWashes, usedWashes, remainingWashes)

#### 2. laundryBags Collection
**Stores:** All laundry requests and status
**Fields:**
- bagNumber (auto-generated)
- studentId (reference to user)
- clothesCount
- status (pending_pickup, picked_up, washing, washed, delivered, collected)
- statusHistory (array of status changes)
- timestamps (submittedAt, pickedUpAt, washedAt, deliveredAt)

#### 3. chatHistory Collection (Optional)
**Stores:** Chat conversations
**Fields:**
- userId
- messages (array of user and AI messages)
- sessionId

### Database Relationships
```
User (1) -----> (Many) LaundryBags
  └─ One student has many laundry bags

User (1) -----> (Many) ChatHistory
  └─ One user has many chat sessions

LaundryBag (1) -----> (Many) StatusHistory
  └─ One bag has multiple status updates
```

---

## 9. API Endpoints Structure

### Authentication APIs
```
POST   /api/auth/register      → Register new user
POST   /api/auth/login         → Login user
GET    /api/auth/me            → Get current user info (protected)
```

### User Management APIs
```
GET    /api/users              → Get all users (admin only)
GET    /api/users/:id          → Get user by ID
PUT    /api/users/:id          → Update user
DELETE /api/users/:id          → Delete user (admin only)
```

### Laundry Management APIs
```
POST   /api/laundry/submit     → Submit new laundry (student)
GET    /api/laundry/my-bags    → Get my bags (student)
GET    /api/laundry/all        → Get all bags (staff)
GET    /api/laundry/:id        → Get bag details
PUT    /api/laundry/:id/status → Update bag status (staff)
DELETE /api/laundry/:id        → Delete bag (admin)
```

### AI Service APIs
```
POST   /api/ai/chat            → Send message to chatbot
POST   /api/ai/predict-time    → Predict wash completion time
```

---

## 10. Testing Approach

### What to Test

#### Backend Testing
1. **Authentication**
   - Registration with valid data
   - Login with correct credentials
   - Login with wrong credentials
   - Access protected routes without token
   - Access protected routes with invalid token

2. **Laundry Management**
   - Submit laundry with valid data
   - Submit without remaining washes
   - Update status by staff
   - Students can't update other's bags
   - Wash count decreases on collection

#### Mobile App Testing
1. **Manual Testing**
   - Test on real Android device with Expo Go
   - Test all screens and navigation
   - Test API integration
   - Test error messages
   - Test loading states

2. **User Flows**
   - Complete registration → login → submit laundry
   - Login → view bags → check status
   - Chat with AI bot

#### Web Portal Testing
1. **Staff Workflows**
   - Login as staff
   - View all pending bags
   - Update bag status
   - Search and filter bags

### Testing Tools
- **Postman**: Test APIs manually
- **Jest**: Automated backend testing
- **Expo Go**: Test mobile app on device
- **Chrome DevTools**: Test web portal

---

## 11. Deployment Strategy

### Phase 1: Database Deployment
**Platform:** MongoDB Atlas (Free tier)
**Steps:**
1. Create account
2. Create cluster (M0 - Free)
3. Create database user
4. Get connection string
5. Update backend .env

---

### Phase 2: Backend Deployment
**Platform:** Render.com or Railway.app (Free tier)
**Steps:**
1. Push code to GitHub
2. Create web service on Render
3. Connect GitHub repo
4. Add environment variables
5. Deploy

**Environment Variables to Add:**
- MONGODB_URI
- JWT_SECRET
- PORT
- NODE_ENV=production

---

### Phase 3: AI Service Deployment
**Platform:** Render.com (Python)
**Steps:**
1. Push Flask code to GitHub
2. Create Python web service
3. Add Gemini API key
4. Deploy

---

### Phase 4: Mobile App Distribution
**Option 1: Expo Publish (Quick)**
```
npx expo publish
```
Users scan QR code with Expo Go app

**Option 2: Build APK (Production)**
```
eas build --platform android
```
Distribute APK file to students

---

### Phase 5: Web Portal Deployment
**Platform:** Vercel or Netlify (Free)
**Steps:**
1. Build production version
2. Deploy to Vercel
3. Connect custom domain (optional)

---

## 12. 6-Week Timeline

### Week 1: Foundation & Planning
**Time:** 5-6 hours
- [ ] Install Node.js, Python, MongoDB
- [ ] Create project folder structure
- [ ] Initialize all projects
- [ ] Set up Git repository
- [ ] Design database schema on paper
- [ ] Create wireframes for mobile screens
- [ ] Get Gemini API key
- [ ] Create MongoDB Atlas account

**End of Week 1:** You have empty projects ready to code

---

### Week 2: Backend Development
**Time:** 10-12 hours
- [ ] Create database models (User, LaundryBag)
- [ ] Build authentication system
- [ ] Implement JWT middleware
- [ ] Create user registration API
- [ ] Create login API
- [ ] Build laundry submission API
- [ ] Build get bags APIs
- [ ] Test all APIs with Postman
- [ ] Document API endpoints

**End of Week 2:** Backend fully functional and tested

---

### Week 3: Frontend Development
**Time:** 12-15 hours

**Mobile App (8-10 hours):**
- [ ] Set up navigation
- [ ] Create login screen
- [ ] Create register screen
- [ ] Build home dashboard
- [ ] Create submit laundry screen
- [ ] Build my bags list screen
- [ ] Create bag detail screen
- [ ] Connect all screens to backend APIs
- [ ] Test on phone with Expo Go

**Web Portal (4-5 hours):**
- [ ] Create login page
- [ ] Build dashboard with stats
- [ ] Create bag management page (table)
- [ ] Implement status update functionality
- [ ] Connect to backend APIs

**End of Week 3:** Both apps working with backend

---

### Week 4: AI Integration
**Time:** 8-10 hours
- [ ] Set up Python Flask project
- [ ] Install Gemini API library
- [ ] Create chat endpoint
- [ ] Test chatbot in Postman
- [ ] Build chat UI in mobile app
- [ ] Connect mobile app to AI service
- [ ] Test conversation flow
- [ ] Implement context (pass wash count to AI)
- [ ] Handle errors gracefully

**End of Week 4:** Working AI chatbot in mobile app

---

### Week 5: Testing & Refinement
**Time:** 8-10 hours
- [ ] Write backend unit tests
- [ ] Test all API endpoints thoroughly
- [ ] Test mobile app end-to-end
- [ ] Test web portal functionality
- [ ] Test chatbot responses
- [ ] Fix bugs discovered
- [ ] Improve error messages
- [ ] Add loading indicators
- [ ] Optimize performance
- [ ] Test with multiple users

**End of Week 5:** Bug-free, polished application

---

### Week 6: Deployment & Documentation
**Time:** 8-10 hours
- [ ] Deploy MongoDB to Atlas
- [ ] Deploy backend to Render
- [ ] Deploy AI service to Render
- [ ] Deploy web portal to Vercel
- [ ] Build mobile app APK
- [ ] Test deployed system
- [ ] Write API documentation
- [ ] Create user manual (how to use app)
- [ ] Create admin guide (how to manage system)
- [ ] Prepare presentation slides
- [ ] Record demo video
- [ ] Finalize project report

**End of Week 6:** Complete, deployed, documented system

---

## Key Success Factors

### 1. Start Simple
Don't try to build everything at once. Follow the priority order.

### 2. Test Frequently
Test each feature immediately after building it. Don't wait until the end.

### 3. Use Free Resources
- MongoDB Atlas (Free 512MB)
- Render/Railway (Free tier)
- Gemini API (Free 60 requests/min)
- Expo Go (Free for testing)

### 4. Keep Backups
- Use Git for version control
- Commit after completing each feature
- Push to GitHub regularly

### 5. Document as You Go
- Write down API endpoints
- Note any issues faced
- Keep track of environment variables

---

## Learning Resources

### If You Get Stuck

#### Node.js & Express
- Official docs: https://expressjs.com/
- YouTube: "Node.js Crash Course" by Traversy Media

#### React Native
- Official docs: https://reactnative.dev/
- YouTube: "React Native Tutorial" by Academind

#### MongoDB
- Official docs: https://www.mongodb.com/docs/
- YouTube: "MongoDB Crash Course" by Web Dev Simplified

#### React.js
- Official docs: https://react.dev/
- YouTube: "React Tutorial" by Net Ninja

#### Gemini API
- Official docs: https://ai.google.dev/docs/
- GitHub examples: Search "gemini api examples"

---

## Final Checklist

### Before Submission
- [ ] All features working
- [ ] No major bugs
- [ ] Backend deployed and accessible
- [ ] Mobile app tested on real device
- [ ] Web portal responsive
- [ ] API documentation complete
- [ ] User manual written
- [ ] Demo video recorded
- [ ] Presentation prepared
- [ ] Code pushed to GitHub
- [ ] Environment variables documented

---

## Tips for Success

1. **Follow this exact order** - Don't skip phases
2. **Test after each step** - Don't accumulate bugs
3. **Ask for help early** - Don't waste days stuck
4. **Keep it simple** - MVP first, enhancements later
5. **Document everything** - You'll need it for the report
6. **Start early** - Don't rush in the last week

---

**This roadmap gives you a clear path from zero to a complete, deployed laundry management system in 6 weeks.**

**Focus on one phase at a time, and you'll have a successful MCA project!**
