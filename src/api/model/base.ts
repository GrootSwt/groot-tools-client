/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosResponse } from "axios";

// get delete request params
export interface IRequestParams {
  [prop: string]: any;
}
// post put request data
export interface IRequestData {
  [prop: string]: any;
}
// response data
export interface IResponseData {
  data?: any;
  message?: any;
  [prop: string]: any;
}
// response
export interface IResponse extends AxiosResponse {
  data: IResponseData;
}

export class BaseService {
  baseUrl: string;
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
}
