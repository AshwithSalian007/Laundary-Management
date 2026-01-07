# Student Laundry Management App

A React Native mobile application for students to manage their laundry requests and track wash plans.

## Features Implemented

### Authentication Flow
- **Login Screen**: Email and password authentication
- **Token Management**: Secure token storage using Expo SecureStore
- **Auto-login**: Automatic authentication check on app start
- **Session Management**: Single device login with Redis backend integration
- **Dashboard**: Home screen displaying user information

### Technical Stack
- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Stack Navigator)
- **State Management**: Context API
- **Storage**: Expo SecureStore (encrypted)
- **API Client**: Axios with interceptors
- **Theme**: Clean Blue & White color scheme

## Setup Instructions

### 1. Install Dependencies
```bash
cd student-app
npm install
```

### 2. Configure Backend URL

Update the API base URL in `src/config/api.js`:

```javascript
const API_BASE_URL = 'http://your-backend-url:5000/api';
```

**For local development:**
- Android Emulator: `http://10.0.2.2:5000/api`
- iOS Simulator: `http://localhost:5000/api`
- Physical Device: `http://YOUR_COMPUTER_IP:5000/api`

### 3. Run the App

```bash
# Start the development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run on web
npm run web
```

## Project Structure

```
student-app/
├── src/
│   ├── config/
│   │   └── api.js                 # Axios configuration & interceptors
│   ├── constants/
│   │   └── theme.js               # Color scheme & design tokens
│   ├── context/
│   │   └── AuthContext.js         # Authentication state management
│   ├── navigation/
│   │   └── AppNavigator.js        # Navigation configuration
│   ├── screens/
│   │   ├── LoginScreen.js         # Login screen
│   │   └── DashboardScreen.js     # Dashboard/Home screen
│   └── services/
│       └── authService.js         # Authentication API calls
├── App.js                         # Root component
└── package.json
```

## Authentication Flow

1. **App Launch**:
   - AuthContext checks for stored token in SecureStore
   - If token exists, validates it with backend
   - Shows loading screen during check

2. **No Token / Invalid Token**:
   - Redirects to Login screen
   - User enters email and password
   - Credentials sent to backend

3. **Valid Token**:
   - Automatically logs in user
   - Navigates to Dashboard
   - Token included in all API requests via interceptor

4. **Logout**:
   - Calls backend logout endpoint
   - Clears token from SecureStore
   - Redirects to Login screen

## Backend API Endpoints Used

- `POST /api/admin/student/login` - Student login
- `POST /api/admin/student/logout` - Student logout

## Theme Colors

### Primary Colors
- **Primary Blue**: `#2563EB` - Main brand color
- **Primary Light**: `#60A5FA` - Lighter variant
- **Primary Dark**: `#1E40AF` - Darker variant

### Secondary Colors
- **Secondary Green**: `#10B981` - Success & freshness
- **Secondary Light**: `#34D399`
- **Secondary Dark**: `#059669`

### Status Colors
- **Success**: `#10B981` (Green)
- **Error**: `#EF4444` (Red)
- **Warning**: `#F59E0B` (Orange)
- **Info**: `#3B82F6` (Blue)

## Security Features

- **Encrypted Storage**: Auth tokens stored using Expo SecureStore
- **Automatic Token Injection**: Axios interceptor adds token to requests
- **Error Handling**: Automatic logout on 401 (unauthorized)
- **Input Validation**: Client-side validation for email and password
- **Secure Communication**: HTTPS recommended for production

## Next Steps

To add more features, refer to `STUDENT_APP_FEATURES.md` for the complete feature list.

### Priority Features to Implement:
1. Wash Plan Overview (dashboard cards)
2. Create New Wash Request screen
3. Request History screen
4. Request Details screen
5. Pull to refresh functionality
6. Error handling improvements

## Troubleshooting

### Cannot connect to backend
- Check if backend server is running
- Verify the API_BASE_URL in `src/config/api.js`
- For physical devices, ensure device and computer are on the same network
- Check firewall settings

### Login fails even with correct credentials
- Check backend console for errors
- Verify Redis is running (required for session management)
- Check network tab in React Native Debugger

### App crashes on startup
- Clear Expo cache: `expo start -c`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for any missing dependencies

## Development

### Adding New Screens
1. Create screen component in `src/screens/`
2. Add screen to navigation in `src/navigation/AppNavigator.js`
3. Use theme colors from `src/constants/theme.js`

### Making API Calls
1. Import api client: `import api from '../config/api'`
2. Make requests: `await api.get('/endpoint')` or `await api.post('/endpoint', data)`
3. Token automatically included in headers

### Updating Theme
- Edit colors in `src/constants/theme.js`
- All screens use these constants for consistency

## License

This project is part of the Student Laundry Management System.
