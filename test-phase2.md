# Phase 2 Testing Guide

## 🚀 Testing the Phase 2 Implementation

### Prerequisites

-   ✅ Backend containers running (API, DB, Redis, MinIO, Nginx)
-   ✅ Frontend dev server running on http://localhost:5173
-   ✅ Backend API accessible via http://localhost

### 🧪 Test Scenarios

#### 1. **Authentication & Basic Navigation**

1. Open http://localhost:5173
2. Login with test credentials
3. Verify navigation includes new "Analytics" link
4. Check that NotificationBell appears in header

#### 2. **Dashboard - Continue Learning Section**

1. Navigate to Dashboard
2. Look for "Continue Learning" section
3. Verify ResumeCard components display for in-progress courses
4. Test resume functionality (if you have progress data)

#### 3. **Real-time Notifications**

1. Check NotificationBell in header
2. Look for unread count badge
3. Click bell to open notification dropdown
4. Test mark as read functionality
5. Verify toast notifications appear for actions

#### 4. **Video Player Features**

1. Navigate to a course with video content
2. Test video player controls:
    - Play/pause (spacebar or click)
    - Seek (arrow keys, J/L, number keys 0-9)
    - Volume control (arrow up/down, M to mute)
    - Fullscreen (F key)
    - Quality selection (if available)
    - Playback speed control
3. Verify progress tracking (check browser network tab for progress API calls)

#### 5. **Progress Tracking**

1. Watch a video for a few seconds
2. Check browser dev tools Network tab for progress API calls
3. Navigate away and back to verify resume functionality
4. Check course content list for progress bars

#### 6. **Analytics Dashboard**

1. Navigate to Analytics page
2. Verify charts load (may show empty state if no data)
3. Check learning activity calendar
4. Verify stats cards display
5. Test chart interactions

#### 7. **WebSocket Connection**

1. Open browser dev tools Console
2. Look for WebSocket connection messages
3. Check for any connection errors
4. Verify real-time features work

### 🔍 Debugging Tips

#### Check Browser Console

-   Look for any JavaScript errors
-   Check for failed API calls
-   Verify WebSocket connection status

#### Check Network Tab

-   Verify API calls to `/api/v1/*` endpoints
-   Check WebSocket connection to `/ws/notifications`
-   Look for progress tracking API calls

#### Check Backend Logs

```bash
cd /home/gyan/Use/react/course/backend
docker-compose logs -f api
```

### 🐛 Common Issues & Solutions

#### 1. **WebSocket Connection Failed**

-   Check if backend WebSocket endpoints are working
-   Verify CORS configuration
-   Check browser console for connection errors

#### 2. **Progress Not Saving**

-   Check browser network tab for failed API calls
-   Verify progress service endpoints exist
-   Check backend logs for errors

#### 3. **Charts Not Loading**

-   Verify recharts dependency is installed
-   Check for data availability
-   Look for JavaScript errors in console

#### 4. **Video Player Issues**

-   Check if video URLs are accessible
-   Verify video format compatibility
-   Check for CORS issues with video streaming

### 📊 Expected Behavior

#### ✅ Working Features

-   Real-time notifications via WebSocket
-   Progress tracking every 5 seconds during video playback
-   Resume functionality from last position
-   Analytics dashboard with charts
-   Full-featured video player with keyboard shortcuts
-   Continue Learning section on Dashboard

#### ⚠️ Known Limitations

-   WebSocket notifications require backend implementation
-   Progress analytics need real user data
-   Video quality selection depends on backend video processing
-   Learning activity calendar uses mock data

### 🎯 Success Criteria

-   [ ] Frontend loads without errors
-   [ ] Authentication works
-   [ ] Dashboard shows Continue Learning section
-   [ ] Video player has all controls working
-   [ ] Progress tracking saves to backend
-   [ ] Analytics page loads with charts
-   [ ] WebSocket connects successfully
-   [ ] Notifications system works
-   [ ] Resume functionality works

### 🚀 Next Steps

1. Test with real user data
2. Implement backend WebSocket notifications
3. Add real video content for testing
4. Test with multiple users for real-time features
5. Performance testing with large datasets
