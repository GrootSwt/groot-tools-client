import { AxiosResponse } from "axios";
import { BaseService, IRequestData } from "../model";
import { postRequest } from "../request";
import { IUser } from "./user";

export interface ILoginForm {
  account?: string;
  password?: string;
}

export interface ILoginResponseData extends IRequestData {
  data: IUser;
}

class Login extends BaseService {
  login(form: ILoginForm) {
    return postRequest(this.baseUrl + "/login", form) as Promise<
      AxiosResponse<ILoginResponseData>
    >;
  }
}

export default Login;
