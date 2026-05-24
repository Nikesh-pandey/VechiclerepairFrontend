import { jwtDecode } from "jwt-decode";

export const getToken = () => {
  return localStorage.getItem("token");
};

export const isAuthenticated = () => {
  const token = getToken();

  if (!token) {
    return false;
  }

  const decoded = getDecodedToken();

  if (!decoded) {
    return false;
  }

  if (decoded.exp && decoded.exp * 1000 <= Date.now()) {
    return false;
  }

  return true;
};

export const getDecodedToken = () => {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    return jwtDecode(token);
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
};

export const getUserRole = () => {
  const decoded = getDecodedToken();

  let role =
    decoded?.role ||
    decoded?.authority ||
    decoded?.authorities?.[0] ||
    decoded?.roles?.[0] ||
    localStorage.getItem("role");

  if (!role) {
    return null;
  }

  if (!role.startsWith("ROLE_")) {
    role = `ROLE_${role}`;
  }

  return role;
};

export const getDashboardPathByRole = (role) => {
  if (!role) {
    return "/login";
  }

  if (!role.startsWith("ROLE_")) {
    role = `ROLE_${role}`;
  }

  switch (role) {
    case "ROLE_ADMIN":
      return "/admin/dashboard";

    case "ROLE_OPERATOR":
      return "/operator/dashboard";

    case "ROLE_CUSTOMER":
      return "/customer/dashboard";

    default:
      return "/login";
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  localStorage.removeItem("operatorCustomerResponses");
};
