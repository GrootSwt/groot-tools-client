import { BaseService } from "../model";
import { postRequest } from "../request";

export interface ILoginForm {
  systemPassword?: string;
  account?: string;
  password?: string;
}

class Login extends BaseService {
  postLogin(data: ILoginForm) {
    return postRequest(this.baseUrl + "/login", data);
  }
}

export default Login;
