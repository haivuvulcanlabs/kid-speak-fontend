# KidSpeak Frontend Authentication Integration

## Overview
This document describes the authentication integration for the KidSpeak frontend application.

## Features Implemented

### 1. Authentication Service (`src/services/authService.js`)
- Complete API integration with backend authentication endpoints
- JWT token management
- User profile management
- Chat session management
- Guest mode support

### 2. Authentication Context (`src/contexts/AuthContext.js`)
- Global authentication state management
- Login, register, logout functions
- Profile and preferences management
- Error handling

### 3. Authentication Components
- **Login Component** (`src/components/Login.js`)
  - Email/password login
  - Form validation
  - Error handling
  - Guest mode option

- **Register Component** (`src/components/Register.js`)
  - User registration with validation
  - Age, name, email, password fields
  - Language preference selection
  - Password strength requirements

- **ProtectedRoute Component** (`src/components/ProtectedRoute.js`)
  - Route protection logic
  - Loading states
  - Authentication flow management

### 4. ChatPage Integration
- User authentication bar
- Session management
- Chat history persistence
- User info display
- Logout functionality

## Setup Instructions

### 1. Environment Variables
Create a `.env.local` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

For production:
```env
REACT_APP_API_URL=https://your-backend-url.vercel.app/api
```

### 2. Install Dependencies
```bash
cd frontend
npm install
```

### 3. Start Development Server
```bash
npm start
```

## Authentication Flow

### 1. Initial Load
- App checks for existing authentication token
- If valid token exists, user is automatically logged in
- If no token or invalid token, user sees login screen

### 2. Login Process
- User enters email and password
- Frontend validates input
- API call to `/api/auth/login`
- On success: token stored, user state updated
- On failure: error message displayed

### 3. Registration Process
- User fills registration form
- Frontend validates all fields
- API call to `/api/auth/register`
- On success: user logged in automatically
- On failure: error message displayed

### 4. Chat Integration
- Authenticated users: chat history saved to database
- Guest users: chat works without persistence
- Session management for authenticated users
- User info displayed in chat interface

## Component Usage

### Using Authentication Context
```jsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (isAuthenticated) {
    return <div>Welcome, {user.name}!</div>;
  }
  
  return <div>Please log in</div>;
}
```

### Protected Routes
```jsx
import ProtectedRoute from '../components/ProtectedRoute';

function App() {
  return (
    <ProtectedRoute requireAuth={false}>
      <ChatPage />
    </ProtectedRoute>
  );
}
```

### Authentication Service
```jsx
import authService from '../services/authService';

// Login
const response = await authService.login(email, password);

// Register
const response = await authService.register(userData);

// Send authenticated message
const response = await authService.sendMessage(message, provider, topic, sessionId);
```

## API Integration

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/preferences` - Update preferences
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Chat Endpoints
- `POST /api/chat/start-session` - Start chat session (authenticated)
- `POST /api/chat/send-message` - Send message (works for both authenticated and guest)
- `GET /api/chat/sessions` - Get chat sessions (authenticated)
- `GET /api/chat/sessions/:id/messages` - Get session messages (authenticated)

## Error Handling

### Validation Errors
- Form validation with real-time feedback
- Server-side validation error display
- User-friendly error messages in Vietnamese

### Authentication Errors
- Token expiration handling
- Network error handling
- Automatic logout on authentication failure

## Security Features

### 1. Token Management
- JWT tokens stored in localStorage
- Automatic token validation
- Token refresh handling

### 2. Input Validation
- Client-side validation
- Server-side validation
- XSS protection

### 3. CORS Configuration
- Backend configured for specific origins
- Credentials support for authenticated requests

## Styling

### Authentication Components
- Modern gradient design
- Responsive layout
- Loading states and animations
- Error message styling

### Chat Integration
- User authentication bar
- Seamless integration with existing chat UI
- Responsive design

## Testing

### Manual Testing
1. Test registration flow
2. Test login flow
3. Test logout functionality
4. Test guest mode
5. Test chat persistence
6. Test error handling

### Test Scenarios
- Valid registration
- Invalid email format
- Weak password
- Existing email registration
- Valid login
- Invalid credentials
- Token expiration
- Network errors

## Deployment

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or other hosting service
3. Update environment variables for production

### Backend Integration
1. Ensure backend is deployed and accessible
2. Update `REACT_APP_API_URL` to production backend URL
3. Test authentication flow in production

## Troubleshooting

### Common Issues
1. **CORS Errors**: Check backend CORS configuration
2. **Token Issues**: Clear localStorage and re-login
3. **API Errors**: Check backend logs and network tab
4. **Validation Errors**: Check form validation rules

### Debug Tools
- Browser DevTools Network tab
- React DevTools
- Console logs for debugging
- Backend API logs

## Future Enhancements

### Planned Features
1. Password reset functionality
2. Email verification
3. Social login integration
4. User profile pictures
5. Advanced user preferences
6. Chat history search
7. Export chat history
8. User analytics dashboard
