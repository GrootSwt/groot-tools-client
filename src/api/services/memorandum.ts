import { BaseService, IResponse, IResponseData } from "../model";
import { deleteRequest, getRequest } from "../request";

export interface IMemorandum {
  id?: string;
  userId?: string;
  content: string;
  createTime?: Date;
  updateTime?: Date;
}

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
}

export default Memorandum;
