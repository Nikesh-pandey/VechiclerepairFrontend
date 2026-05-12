import { getAxiosInstance } from "./AxiosInstance";
import { endpoints } from "./Endpoints";

const getErrorMessage = (data, fallbackMessage) => {
  const message = data?.message || data?.error || data;

  if (!message) {
    return fallbackMessage;
  }

  if (typeof message === "string") {
    return message;
  }

  return JSON.stringify(message);
};

const getErrorResult = (err, fallbackMessage) => ({
  error: true,
  message: getErrorMessage(err.response?.data, fallbackMessage),
  status: err.response?.status,
});

export const ApiService = {
  // ================= AUTH =================

  register: async (data) => {
    try {
      const res = await getAxiosInstance(false).post(
        endpoints.register,
        data
      );
      return res.data;
    } catch (err) {
      console.error("Register Error:", err);
      return getErrorResult(err, "Registration failed.");
    }
  },

  login: async (data) => {
    try {
      const res = await getAxiosInstance(false).post(
        endpoints.login,
        data
      );
      return res.data;
    } catch (err) {
      console.error("Login Error:", err);
      return getErrorResult(err, "Login failed.");
    }
  },

  // ================= OPERATOR =================

  registerOperator: async (formData) => {
    try {
      const res = await getAxiosInstance().post(
        endpoints.operatorRegister,
        formData
      );
      return res.data;
    } catch (err) {
      console.error("Operator Register Error Full:", err);
      console.error("Backend Error:", err.response?.data);
      console.error("Status Code:", err.response?.status);

      return getErrorResult(err, "Operator registration failed.");
    }
  },

  getOperatorUpdate: async (id) => {
    try {
      const res = await getAxiosInstance().get(
        endpoints.operatorUpdate(id)
      );
      return res.data;
    } catch (err) {
      console.error("Operator Update Error:", err);
      return getErrorResult(err, "Failed to load operator update.");
    }
  },

  // ================= ADMIN =================

  getOperatorData: async () => {
    try {
      const res = await getAxiosInstance().get(
        endpoints.adminOperatorData
      );
      return res.data;
    } catch (err) {
      console.error("Admin Operator Data Error:", err);
      return getErrorResult(err, "Failed to load operator data.");
    }
  },

  respondToOperator: async (id, data) => {
    try {
      const res = await getAxiosInstance().patch(
        endpoints.adminResponseToOperator(id),
        data
      );
      return res.data;
    } catch (err) {
      console.error("Admin Response Error:", err);
      return getErrorResult(err, "Failed to update operator status.");
    }
  },


  findGarage: async (data) => {
    try {
      const res = await getAxiosInstance().post(
        endpoints.customerFindGarage,
        data
      );
      return res.data;
    } catch (err) {
      console.error("Customer Find Garage Error:", err);
      return getErrorResult(err, "Failed to find garage.");
    }
  },

customerConfirmRequest: async (id, data) => {
  try {
    const res = await getAxiosInstance().post(
      endpoints.customerConfirmRequest(id),
      data
    );

    return res.data;
  } catch (err) {
    console.log("Error occurred in confirmRequest", err);
    return {
      error: true,
      message: err.response?.data?.message || err.response?.data || "Failed in confirmRequest",
      status: err.response?.status,
    };
  }
},

};
