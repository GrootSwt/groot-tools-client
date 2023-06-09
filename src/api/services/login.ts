import { postRequest } from "../request";

export interface ILoginForm {
  systemPassword?: string;
  account?: string;
  password?: string;
}

export class Login {
  private baseUrl: string;
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  postLogin(data: ILoginForm) {
    return postRequest(this.baseUrl + "/login", data);
  }
}
