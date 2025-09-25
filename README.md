# Course Management App

A comprehensive multi-screen React application for course management with user authentication, course viewing, note-taking, and admin functionality.

## Features

### 🔐 Authentication System

-   User login with email and password
-   Role-based access (User/Admin)
-   Persistent authentication using localStorage
-   Protected routes for authenticated users

### 📚 Course Management

-   **User Dashboard**: Overview of subscribed courses and recent activity
-   **Course List**: Browse and filter subscribed courses by difficulty level
-   **Course Viewer**: Watch videos and view presentations with full controls
-   **Progress Tracking**: Track learning progress through course content

### 📝 Note-Taking System

-   **Add Notes**: Take notes while watching course content
-   **Edit/Delete**: Full CRUD operations for notes
-   **Search & Filter**: Find notes by content or course
-   **Persistent Storage**: Notes saved locally and persist across sessions

### 👨‍💼 Admin Panel

-   **Course Upload**: Upload new courses with videos and presentations
-   **Content Management**: Manage existing courses and content
-   **File Upload**: Support for video files, PDFs, and PowerPoint presentations
-   **Course Metadata**: Set difficulty levels, categories, and descriptions

## Technology Stack

-   **Frontend**: React 19 with TypeScript
-   **Routing**: React Router DOM
-   **Styling**: Tailwind CSS
-   **Icons**: Lucide React
-   **Build Tool**: Vite
-   **Linting**: ESLint with TypeScript support

## Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   pnpm (recommended) or npm

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd course-management-app
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Demo Credentials

### Regular User

-   **Email**: user@example.com
-   **Password**: password

### Admin User

-   **Email**: admin@example.com
-   **Password**: password

## Project Structure

```
src/
├── components/          # React components
│   ├── AdminPanel.tsx   # Admin interface for course management
│   ├── CourseList.tsx   # Course listing and filtering
│   ├── CourseViewer.tsx # Video/presentation player
│   ├── Dashboard.tsx    # User dashboard
│   ├── Layout.tsx       # Main layout with navigation
│   ├── Login.tsx        # Authentication form
│   └── NotesList.tsx    # Notes management
├── contexts/            # React contexts
│   └── AuthContext.tsx  # Authentication state management
├── data/                # Mock data and utilities
│   └── mockData.ts      # Sample courses, users, and notes
├── types/               # TypeScript type definitions
│   └── index.ts         # Interface definitions
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles and Tailwind imports
```

## Key Features Explained

### Authentication Flow

-   Users log in with email/password
-   Authentication state is managed via React Context
-   Protected routes redirect unauthenticated users to login
-   Admin-only routes check user role

### Course Viewing

-   Support for both video and presentation content
-   Video player with play/pause, volume, and fullscreen controls
-   Course content navigation (previous/next)
-   Real-time note-taking while viewing content

### Note Management

-   Notes are associated with specific courses and content
-   Local storage persistence for offline access
-   Search functionality across all notes
-   Filter notes by course

### Admin Functionality

-   Upload new courses with metadata
-   File upload for thumbnails and content
-   Course management (edit/delete)
-   Content organization and categorization

## Development

### Available Scripts

-   `pnpm dev` - Start development server
-   `pnpm build` - Build for production
-   `pnpm preview` - Preview production build
-   `pnpm lint` - Run ESLint

### Code Style

The project follows these conventions:

-   TypeScript for type safety
-   Functional components with hooks
-   Tailwind CSS for styling
-   ESLint for code quality
-   Comprehensive commenting for maintainability

## Future Enhancements

-   [ ] Real backend API integration
-   [ ] User registration system
-   [ ] Course subscription management
-   [ ] Progress tracking and analytics
-   [ ] Discussion forums for courses
-   [ ] Mobile app development
-   [ ] Video streaming optimization
-   [ ] Advanced search and filtering
-   [ ] Course ratings and reviews
-   [ ] Certificate generation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
