# Contest Tracker

## Overview

Contest Tracker is a full-stack web application designed to help users track competitive programming contests. It features user authentication, contest bookmarking, and a responsive UI for viewing upcoming and past contests.

## Features

- **User Authentication**: Secure login and registration using JWT or session-based authentication.
- **Contest Tracking**: View upcoming and past contests from various platforms.
- **Bookmarking**: Users can bookmark contests for easy access.
- **Responsive Design**: The application is designed to work on both desktop and mobile devices.
- **Dark Mode**: Toggle between light and dark themes.

## Setup Instructions

### Prerequisites

- Node.js and npm installed
- MongoDB instance running (docker preferably)

### Backend Setup

1. **Navigate to the server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**: Create a `.env` file in the server directory with the following variables:
   ```
   MONGODB_URI=docker run --name mongodb -p 27017:27017 -d mongodb/mongodb-community-server:latest
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

## Usage

- **Access the application**: Open your browser and navigate to `http://localhost:5173(if it is available)`.
- **Register/Login**: Create an account or log in to access all features.
- **View Contests**: Browse upcoming and past contests.
- **Bookmark Contests**: Click the bookmark icon to save contests for later.

## Code Structure

### Backend

- **server.js**: Main entry point for the backend server. Sets up routes and middleware.
- **models/**: Contains Mongoose models for users and bookmarks.
- **routes/**: Defines API endpoints for authentication, contests, and bookmarks.
- **middleware/**: Contains authentication middleware to protect routes.

### Frontend

- **src/components/**: Contains React components for the UI, including `ContestTracker`, `ContestCard`, `Login`, and `Register`.
- **src/context/**: Provides context for authentication state management.
- **src/App.jsx**: Main application component that sets up routing and theme management.

## Commands

- **Start Backend**: `npm start` (from the `server` directory)
- **Start Frontend**: `npm start` (from the `frontend` directory)
- **Build Frontend**: `npm run build` (from the `frontend` directory)

## Troubleshooting

- **401 Unauthorized**: Ensure the user is logged in and the token/session is valid.
- **Database Connection Issues**: Verify the MongoDB URI and ensure the database is running.

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.