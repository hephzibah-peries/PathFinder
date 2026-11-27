import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: 'STUDENT' | 'COMPANY' | 'ADMIN';
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF6F4]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#7A4B43] border-t-transparent" />
          <p className="text-sm font-medium text-[#7A6A65]">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = (user.role || '').toUpperCase();

  // If user has ADMIN role, allow access across portals
  if (role === 'ADMIN') {
    return <>{children}</>;
  }

  // Cross-portal redirects:
  // 1. If COMPANY user hits /student/*, send immediately to /company/profile
  if (allowedRole === 'STUDENT' && role !== 'STUDENT') {
    return <Navigate to="/company/profile" replace />;
  }

  // 2. If STUDENT user hits /company/*, send immediately to /student
  if (allowedRole === 'COMPANY' && role !== 'COMPANY') {
    return <Navigate to="/student" replace />;
  }

  // 3. If non-admin tries to access /admin, redirect to their role home
  if (allowedRole === 'ADMIN' && role !== 'ADMIN') {
    return role === 'COMPANY'
      ? <Navigate to="/company/profile" replace />
      : <Navigate to="/student" replace />;
  }

  return <>{children}</>;
}
