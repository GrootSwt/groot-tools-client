import {
  deleteRequest,
  getRequest,
  IResponse,
  IResponseData,
} from "../request";

export interface IMemorandum {
  id?: string;
  userId?: string;
  content: string;
  createTime?: Date;
  updateTime?: Date;
}

export interface ListMemorandumResponse extends IResponseData {
  data: Array<IMemorandum>;
}

export class Memorandum {
  private baseUrl: string;
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  listMemorandumByUserId(userId: string) {
    return getRequest(
      this.baseUrl + `/memorandum/${userId}/listMemorandumByUserId`
    ) as Promise<ListMemorandumResponse>;
  }
  deleteMemorandumById(id: string, userId: string) {
    return deleteRequest(
      this.baseUrl + `/memorandum/${id}/${userId}/deleteMemorandumById`
    ) as Promise<IResponse>;
  }
}
