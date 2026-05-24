export const endpoints = {
  // Auth
  register: "/auth/register",
  login: "/auth/login",

  // Operator
  operatorRegister: "/op/registerOperator",
  operatorUpdate: (id) => `/op/getUpdate/${id}`,
  customerRequest: () => "/op/getCustomerrequest",
  operatorResponseStatus: (id) => `/op/responseStatus/${id}`,
  
  // Admin
  adminOperatorData: "/admin/operatorData",
  adminResponseToOperator: (id) => `/admin/responsetoOperator/${id}`,

  // Customer
  customerFindGarage: "/cu/find",
  customerConfirmRequest: (id) => `/cu/confirmRequest/${id}`,
  customerOperatorResponse: "/cu/responsefromoperator",
};
