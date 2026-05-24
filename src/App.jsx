import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Dashboard from "./FrontPage/DashBoard";
import Login from "./FrontPage/Login";
import Register from "./FrontPage/Register";

import CustomerDashboard from "./FrontPage/CustomerDashboard";
import OperatorDashboard from "./FrontPage/OperatorDashboard";
import AdminDashboard from "./FrontPage/AdminDashboard";
import FindGarage from "./FrontPage/FindGarage";

import ProtectedRoute from "./routes/ProtectedRoute";
import { subscribeGarageWebSocket } from "./Services/GarageWebSocket";
import { getDecodedToken, isAuthenticated } from "./utils/auth";

const getOperatorResponseStorageKey = () => {
  const decodedToken = getDecodedToken();
  const userKey =
    decodedToken?.customerid ||
    decodedToken?.customerId ||
    decodedToken?.id ||
    decodedToken?.userId ||
    decodedToken?.sub;

  return userKey
    ? `operatorCustomerResponses:${userKey}`
    : "operatorCustomerResponses";
};

const isProtectedAppPath = (pathname) => {
  return (
    pathname.startsWith("/customer") ||
    pathname.startsWith("/operator") ||
    pathname.startsWith("/admin") ||
    pathname === "/dashboard"
  );
};

const getResponseList = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.responses)) {
    return response.responses;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.operatorResponses)) {
    return response.operatorResponses;
  }

  if (response && typeof response === "object") {
    return [response];
  }

  return [];
};

const saveAcceptedOperatorResponses = (incomingResponses) => {
  if (incomingResponses.length === 0) {
    return;
  }

  let savedResponses = [];

  try {
    savedResponses = JSON.parse(
      localStorage.getItem(getOperatorResponseStorageKey()) || "[]"
    );
  } catch {
    savedResponses = [];
  }

  const nextResponses = [...savedResponses];

  incomingResponses.forEach((incomingResponse) => {
    const incomingId =
      incomingResponse.requestId ||
      incomingResponse.id ||
      incomingResponse.customerRequestId ||
      incomingResponse.serviceRequestId;
    const operatorId = incomingResponse.operatorId || incomingResponse.operatorid;
    const customerId = incomingResponse.customerId || incomingResponse.customerid;

    const normalizedResponse = {
      ...incomingResponse,
      requestId: incomingId ? String(incomingId) : incomingResponse.requestId,
      operatorId: operatorId ? String(operatorId) : incomingResponse.operatorId,
      operatorid: operatorId ? String(operatorId) : incomingResponse.operatorid,
      customerId: customerId ? String(customerId) : incomingResponse.customerId,
      customerid: customerId ? String(customerId) : incomingResponse.customerid,
      operatorName:
        incomingResponse.operatorName ||
        incomingResponse.name ||
        (operatorId ? `Operator ${operatorId}` : undefined),
      status: incomingResponse.status || "ACCEPTED",
      message:
        incomingResponse.message ||
        "Your request has been accepted by the operator.",
      source: incomingResponse.source || "websocket",
      respondedAt: incomingResponse.respondedAt || new Date().toISOString(),
    };

    const existingIndex = nextResponses.findIndex((response) => {
      const responseId =
        response.requestId ||
        response.id ||
        response.customerRequestId ||
        response.serviceRequestId;

      return incomingId && responseId && String(responseId) === String(incomingId);
    });

    if (existingIndex >= 0) {
      nextResponses[existingIndex] = {
        ...nextResponses[existingIndex],
        ...normalizedResponse,
      };
    } else {
      nextResponses.unshift(normalizedResponse);
    }
  });

  localStorage.setItem(
    getOperatorResponseStorageKey(),
    JSON.stringify(nextResponses)
  );
};

function GarageWebSocketBridge() {
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated() || !isProtectedAppPath(location.pathname)) {
      return undefined;
    }

    const unsubscribe = subscribeGarageWebSocket({
      onMessage: ({ type, payload }) => {
        if (type === "REQUEST_ACCEPTED_BY_OPERATOR") {
          saveAcceptedOperatorResponses(getResponseList(payload));
          return;
        }

        if (type === "NEW_CHAT_MESSAGE") {
          console.log("New chat message received:", payload);
        }
      },
    });

    return unsubscribe;
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <GarageWebSocketBridge />
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
