import React from "react";
import { Navigate } from "react-router-dom";
import { getToken, getUserRole } from "../utils/auth";

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = getToken();
  const role = getUserRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
