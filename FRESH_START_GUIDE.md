# Fresh Start Guide - Student App

## Quick Summary

This is a **student mobile app** for a hostel laundry management system where students can:
1. View their wash plan allocation
2. Submit laundry wash requests
3. Track request status
4. Manage their account

---

## Recommended Tech Stack

### Core Framework
- **React Native with Expo SDK 52** (stable, not 54)
- **React 18.3.1** (NOT React 19 - causes boolean prop issues)
- **Expo CLI** for development

### Navigation
- **@react-navigation/native** v7+
- **@react-navigation/native-stack** v7+
- React Native screens & safe area context

### State Management
- **React Context API** for auth state
- **useState/useEffect** for local state
- No Redux needed for this app size

### API & Storage
- **Axios** for HTTP requests
- **@react-native-async-storage/async-storage** for token storage
- REST API communication with backend

### UI Components
- Custom components (Button, Input, Card)
- React Native core components
- No UI library needed (keeps bundle small)

---

## Project Structure

```
student-app/
├── src/
│   ├── config/
│   │   └── api.js                    # Axios instance, interceptors
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── context/
│   │   │   │   └── AuthContext.js    # Auth state management
│   │   │   ├── screens/
│   │   │   │   └── LoginScreen.js
│   │   │   └── services/
│   │   │       └── authService.js    # Login, logout API calls
│   │   │
│   │   ├── dashboard/
│   │   │   ├── screens/
│   │   │   │   └── DashboardScreen.js
│   │   │   └── services/
│   │   │       └── dashboardService.js
│   │   │
│   │   └── washRequests/
│   │       ├── screens/
│   │       │   ├── NewRequestScreen.js
│   │       │   ├── RequestHistoryScreen.js
│   │       │   └── RequestDetailsScreen.js
│   │       └── services/
│   │           └── washService.js     # All wash-related APIs
│   │
│   ├── shared/
│   │   └── components/
│   │       ├── Button.js
│   │       ├── Input.js
│   │       └── Card.js
│   │
│   └── navigation/
│       └── AppNavigator.js            # Stack navigator setup
│
├── assets/                             # Images, icons, fonts
├── App.js                              # Root component
├── app.json                            # Expo config
└── package.json
```

---

## Core Screens (8 screens)

1. **LoginScreen** - Email/password login
2. **DashboardScreen** - Wash plan overview + quick actions
3. **NewRequestScreen** - Create wash request form
4. **RequestHistoryScreen** - List all requests
5. **RequestDetailsScreen** - Single request with status timeline
6. **WashPlanScreen** - Detailed wash plan info
7. **SettingsScreen** - Account settings
8. **NotificationsScreen** (optional)

---

## Backend API Endpoints (Already Built)

### Authentication
```
POST /api/admin/student/login
POST /api/admin/student/logout
```

### Wash Plans
```
GET /api/wash-plans/my-plan
```

### Wash Requests
```
POST /api/wash-requests
GET /api/wash-requests/my-requests
GET /api/wash-requests/:id
```

---

## Key Features Breakdown

### Must Have (MVP)
✅ Login with email/password
✅ View wash plan (total, used, remaining)
✅ Create wash request (weight, cloth count, notes)
✅ View request history list
✅ View request details with status
✅ Logout
✅ Session management (Redis-based)

### Should Have
- Pull to refresh
- Loading states
- Error handling
- Empty states
- Form validation

### Nice to Have
- Notifications
- Settings screen
- Dark mode
- Request filters

---

## Authentication Flow

```
1. User opens app
2. Check AsyncStorage for token
3. If token exists:
   - Set auth state to true
   - Show Dashboard
4. If no token:
   - Show Login screen
5. On login:
   - Call /api/admin/student/login
   - Save token to AsyncStorage
   - Save user data to AsyncStorage
   - Redirect to Dashboard
6. On logout:
   - Call /api/admin/student/logout
   - Clear AsyncStorage
   - Redirect to Login
```

---

## Data Models (Frontend)

### User
```javascript
{
  _id: string,
  name: string,
  email: string,
  registration_number: string,
  batch_id: {
    batch_label: string,
    department_id: {
      name: string
    }
  }
}
```

### Wash Plan
```javascript
{
  _id: string,
  student_id: string,
  total_washes: number,
  used_washes: number,
  remaining_washes: number,
  max_weight_per_wash: number,
  start_date: string,
  end_date: string,
  year_no: number,
  is_active: boolean
}
```

### Wash Request
```javascript
{
  _id: string,
  student_id: string,
  weight_kg: number,
  cloth_count: number,
  notes: string,
  status: 'pickup_pending' | 'picked_up' | 'washing' | 'completed' | 'returned',
  wash_count: number,
  given_date: string,
  pickup_date: string,
  return_date: string
}
```

---

## Color Scheme (Suggested)

```javascript
const colors = {
  primary: '#3b82f6',      // Blue
  secondary: '#8b5cf6',    // Purple
  success: '#10b981',      // Green
  warning: '#f59e0b',      // Orange
  danger: '#ef4444',       // Red
  background: '#f5f5f5',   // Light gray
  card: '#ffffff',         // White
  text: '#1f2937',         // Dark gray
  textSecondary: '#6b7280',// Medium gray
  border: '#e5e7eb'        // Light border
};
```

---

## Common Issues & Solutions

### Issue: "String cannot be cast to Boolean"
**Solution:** Always explicitly pass booleans for props like `secureTextEntry`, `multiline`, `disabled`, etc.

```javascript
// ❌ Wrong
<TextInput secureTextEntry />
<Button disabled={someCondition} />

// ✅ Correct
<TextInput secureTextEntry={true} />
<Button disabled={Boolean(someCondition)} />
```

### Issue: Port 8081 already in use
**Solution:**
```bash
# Kill all node processes
taskkill /F /IM node.exe

# Or use different port
npx expo start --port 8082
```

### Issue: Expo Go version mismatch
**Solution:** Use Expo SDK 52 (stable) instead of SDK 54

---

## Setup Commands (Fresh Install)

```bash
# Create new Expo app
npx create-expo-app student-app
cd student-app

# Install dependencies
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install axios

# Start development server
npx expo start

# Clear cache if needed
npx expo start --clear
```

---

## package.json (Recommended Versions)

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "react": "18.3.1",
    "react-native": "0.76.3",
    "@react-navigation/native": "^7.1.26",
    "@react-navigation/native-stack": "^7.9.0",
    "@react-native-async-storage/async-storage": "^2.1.0",
    "axios": "^1.7.0",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "4.3.0",
    "expo-status-bar": "~2.0.0"
  }
}
```

---

## app.json (Critical Settings)

```json
{
  "expo": {
    "name": "SmartWash Student",
    "slug": "smartwash-student",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#3b82f6"
    },
    "android": {
      "package": "com.smartwash.student",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#3b82f6"
      }
    }
  }
}
```

**IMPORTANT:** Do NOT add:
- ❌ `"newArchEnabled": true`
- ❌ `"edgeToEdgeEnabled": true`
These cause prop type issues!

---

## API Configuration

```javascript
// src/config/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://YOUR_IP:5000/api'; // Change YOUR_IP

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401/403 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Development Workflow

1. **Start Backend:**
```bash
cd backend
npm start
```

2. **Note Backend IP:**
```
Server running on http://172.17.3.72:5000
```

3. **Update API URL in app:**
```javascript
const API_URL = 'http://172.17.3.72:5000/api';
```

4. **Start Expo:**
```bash
cd student-app
npx expo start
```

5. **Scan QR code** in Expo Go app

6. **Test on device:**
- Login with test student credentials
- Create wash request
- View history

---

## Testing Checklist

### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error handling)
- [ ] Logout functionality
- [ ] Session persistence (close and reopen app)
- [ ] Single device login (logout from other device)

### Dashboard
- [ ] Display wash plan correctly
- [ ] Show correct remaining washes
- [ ] Quick action buttons work
- [ ] Pull to refresh

### Wash Requests
- [ ] Create request with valid data
- [ ] Form validation (weight required)
- [ ] Auto-calculate wash count
- [ ] Check sufficient washes
- [ ] View request history
- [ ] View request details
- [ ] Status timeline display

### Edge Cases
- [ ] No internet connection
- [ ] API timeout
- [ ] Empty states (no requests, no plan)
- [ ] Account deactivated
- [ ] Session expired

---

## Deployment Checklist

### Before Building
- [ ] Update version in app.json
- [ ] Test on real devices (Android & iOS)
- [ ] Test all features
- [ ] Check error handling
- [ ] Verify API endpoints
- [ ] Test with slow network
- [ ] Check memory usage

### Build Commands
```bash
# Android APK
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production
```

---

## Support & Documentation

- **Expo Docs:** https://docs.expo.dev/
- **React Navigation:** https://reactnavigation.org/
- **React Native:** https://reactnative.dev/

---

## Quick Tips

1. **Keep it simple** - Don't over-engineer
2. **Test on real device** - Simulators don't show all issues
3. **Use Expo SDK 52** - More stable than 54
4. **Explicit boolean props** - Always use `={true}` or `={false}`
5. **Clear cache often** - `npx expo start --clear`
6. **Check network** - Ensure backend is accessible from phone
7. **Use TypeScript** (optional) - Catches type issues early
8. **Git commits** - Commit working states frequently

---

## Estimated Timeline

- **Day 1-2:** Setup + Authentication + Navigation
- **Day 3-4:** Dashboard + Wash Plan Display
- **Day 5-6:** Create Wash Request
- **Day 7-8:** Request History + Details
- **Day 9-10:** Polish UI + Error Handling + Testing

**Total: 10 days for MVP** (working 4-6 hours/day)

---

## Final Notes

This is a **clean slate guide** - use it to rebuild the app from scratch without the persistent boolean error. The key is:

1. Use **Expo SDK 52** (not 54)
2. Use **React 18.3.1** (not 19)
3. **Don't add** `newArchEnabled` or `edgeToEdgeEnabled` to app.json
4. **Explicitly type** all boolean props
5. Test frequently on real device

Good luck! 🚀
