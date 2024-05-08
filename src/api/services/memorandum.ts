import { AxiosRequestConfig, AxiosResponse } from "axios";
import { BaseService, IResponse, IResponseData } from "../model";
import { deleteRequest, getRequest, postRequest } from "../request";
import { FileResponse } from "./file";

export enum MemorandumType {
  TEXT = "text",
  FILE = "file",
}

export type IMemorandum = {
  id?: string;
  userId?: string;
  content: string;
  contentType: MemorandumType;
  createTime?: Date;
  updateTime?: Date;
  file?: FileResponse;
};

export interface IListMemorandumResponseData extends IResponseData {
  data: Array<IMemorandum>;
}

class Memorandum extends BaseService {
  listMemorandum(config?: AxiosRequestConfig) {
    return getRequest(
      this.baseUrl + `/memorandum/listMemorandum`,
      null,
      config
    ) as Promise<AxiosResponse<IListMemorandumResponseData>>;
  }
  deleteMemorandumById(id: string) {
    return deleteRequest(
      this.baseUrl + `/memorandum/${id}/deleteMemorandumById`
    ) as Promise<AxiosResponse<IResponse>>;
  }
  uploadFile(data: FormData) {
    return postRequest(
      this.baseUrl + `/memorandum/uploadFile`,
      data
    ) as Promise<AxiosResponse<IResponse>>;
  }
}

export default Memorandum;
