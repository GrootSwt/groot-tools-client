import { AxiosResponse } from "axios";
import { BaseService, IRequestData } from "../model";
import { getRequest } from "../request";

export interface IUser {
  id: string;
  account: string;
  displayName: string;
  phoneNumber: string;
}

export interface IGetUserInfoResponse extends IRequestData {
  data: IUser;
}

class User extends BaseService {
  requestUserInfo() {
    return getRequest(this.baseUrl) as Promise<
      AxiosResponse<IGetUserInfoResponse>
    >;
  }
}

export default User;
