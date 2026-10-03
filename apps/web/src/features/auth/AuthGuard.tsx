import React from 'react';
import { useAuth } from './AuthContext';
// import { Navigate } from 'react-router-dom'; // Assuming react-router is used

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    // In a real app with react-router: return <Navigate to="/login" />;
    return <div>Please log in to access this page.</div>;
  }

  return <>{children}</>;
};
