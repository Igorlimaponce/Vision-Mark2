import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Navbar from './components/Auth/Navbar';
import LoginForm from './components/Auth/LoginForm';
import UserProfile from './components/Auth/UserProfile';

import DashboardPage from './pages/DashboardPage';
import PipelineStudioPage from './pages/PipelineStudioPage';
import CamerasPage from './pages/CamerasPage';
import IdentityManagerPage from './pages/IdentityManagerPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginForm />} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/pipelines" 
                element={
                  <ProtectedRoute>
                    <PipelineStudioPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/pipelines/:id" 
                element={
                  <ProtectedRoute>
                    <PipelineStudioPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/cameras" 
                element={
                  <ProtectedRoute>
                    <CamerasPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/identities" 
                element={
                  <ProtectedRoute>
                    <IdentityManagerPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/events" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Default Routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;