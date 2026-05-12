import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./FrontPage/DashBoard";
import Login from "./FrontPage/Login";
import Register from "./FrontPage/Register";

import CustomerDashboard from "./FrontPage/CustomerDashboard";
import OperatorDashboard from "./FrontPage/OperatorDashboard";
import AdminDashboard from "./FrontPage/AdminDashboard";
import FindGarage from "./FrontPage/FindGarage";

import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer Routes */}
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ROLE_CUSTOMER"]}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/find-garage"
          element={
            <ProtectedRoute allowedRoles={["ROLE_CUSTOMER"]}>
              <FindGarage />
            </ProtectedRoute>
          }
        />

        {/* Operator Routes */}
        <Route
          path="/operator/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ROLE_OPERATOR"]}>
              <OperatorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Unknown Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
