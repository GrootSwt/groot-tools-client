import axiosInstance, { postRequest } from "../request";
export interface ILoginForm {
  systemPassword?: string;
  username?: string;
  password?: string;
}
export function loginRequest(loginForm: ILoginForm) {
  return postRequest(axiosInstance, "/login", loginForm);
}
