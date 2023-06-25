import { BaseService, IResponse, IResponseData } from "../model";
import { deleteRequest, getRequest } from "../request";

export interface IMemorandum {
  id?: string;
  userId?: string;
  content: string;
  createTime?: Date;
  updateTime?: Date;
}

export interface IListMemorandumResponse extends IResponseData {
  data: Array<IMemorandum>;
}

class Memorandum extends BaseService {
  listMemorandumByUserId(userId: string) {
    return getRequest(
      this.baseUrl + `/memorandum/${userId}/listMemorandumByUserId`
    ) as Promise<IListMemorandumResponse>;
  }
  deleteMemorandumById(id: string, userId: string) {
    return deleteRequest(
      this.baseUrl + `/memorandum/${id}/${userId}/deleteMemorandumById`
    ) as Promise<IResponse>;
  }
}

export default Memorandum;
