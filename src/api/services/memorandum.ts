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
  listMemorandum() {
    return getRequest(
      this.baseUrl + `/memorandum/listMemorandum`
    ) as Promise<IListMemorandumResponseData>;
  }
  deleteMemorandumById(id: string) {
    return deleteRequest(
      this.baseUrl + `/memorandum/${id}/deleteMemorandumById`
    ) as Promise<IResponse>;
  }
  uploadFile(data: FormData) {
    return postRequest(this.baseUrl + `/memorandum/uploadFile`, data);
  }
}

export default Memorandum;
