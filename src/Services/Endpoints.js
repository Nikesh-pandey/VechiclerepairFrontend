export const endpoints = {
  // AUTH
  register: "/auth/register",
  login: "/auth/login",

  // OPERATOR
  operatorRegister: "/op/registerOperator",
  operatorUpdate: (id) => `/op/getUpdate/${id}`,

  // ADMIN
  adminOperatorData: "/admin/operatorData",
  adminResponseToOperator: (id) => `/admin/responsetoOperator/${id}`,

  // CUSTOMER
  customerFindGarage: "/cu/find",
  customerConfirmRequest: (id) => `/cu/confirmRequest/${id}`,
};