import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8080/";

export const getAxiosInstance = (useAuth = true) => {
  const token = localStorage.getItem("token");

  const instance = axios.create({
    baseURL: BASE_URL,
    headers: {
      Accept: "application/json",
      ...(useAuth && token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
      }

      return Promise.reject(error);
    }
  );

  return instance;
};
