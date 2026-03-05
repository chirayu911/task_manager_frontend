import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ user, children }) {
  const location = useLocation();

  // If the user is NOT logged in, send them to the login page
  if (!user) {
    // ⭐ Secretly save the URL they tried to visit (e.g., /documents/view/123) in 'state.from'
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If they ARE logged in, let them see the page!
  return children;
}