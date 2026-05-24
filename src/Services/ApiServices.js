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
      
  
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        console.log("Token saved:", res.data.token);
      }
      
      return res.data;
    } catch (err) {
      console.error("Login Error:", err);
      return getErrorResult(err, "Login failed.");
    }
},

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

customerConfirmRequest: async (garageId, data) => {
  try {
    const res = await getAxiosInstance().post(
      endpoints.customerConfirmRequest(garageId), 
      data
    );
    return res.data;
  } catch (err) {
    console.log("Error occurred in confirmRequest", err);
    return {
      error: true,
      message: err.response?.data?.message || "Failed",
      status: err.response?.status,
    };
  }
},

getOperatorResponse: async () => {
  try {
    const res = await getAxiosInstance().get(endpoints.customerOperatorResponse);
    return res.data;
  } catch (err) {
    console.log("Customer Operator Response Error:", err.response?.status);
    console.log("Customer Operator Response Data:", err.response?.data);
    console.log("Customer Operator Response Message:", err.message);
    return getErrorResult(err, "Failed to load operator responses.");
  }
},

customerRequest: async () => {
  try {
    const res = await getAxiosInstance().get(endpoints.customerRequest());
    console.log("Response status:", res.status);
    console.log("Response data:", res.data);
    return res.data;
  } catch (err) {
    console.log("Error:", err.response?.status); 
    console.log("Error message:", err.message);
    return getErrorResult(err, "Failed to load customer requests.");
  }
},



operatorResponseStatus: async (id, data) => {
  try {
    const res = await getAxiosInstance().patch(
      endpoints.operatorResponseStatus(id),
      data,
      {
        params: data,
      }
    );

    return res.data;
  } catch (err) {
    console.log("Operator Response Status Error:", err.response?.status);
    console.log("Operator Response Status Data:", err.response?.data);
    console.log("Operator Response Status Message:", err.message);
    return getErrorResult(err, "Failed to update customer request status.");
  }
}

};
