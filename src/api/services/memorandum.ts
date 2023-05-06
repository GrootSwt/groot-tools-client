import axiosInstance, {
  deleteRequest,
  getRequest,
  IResponse,
} from "../request";

export interface IMemorandum {
  id?: string;
  userId?: string;
  content: string;
  createTime?: Date;
  updateTime?: Date;
}

export interface ListMemorandumResponse extends IResponse {
  data?: Array<IMemorandum>;
}

export function listMemorandumByUserId(
  userId: string
): Promise<ListMemorandumResponse> {
  return getRequest(
    axiosInstance,
    `/memorandum/${userId}/listMemorandumByUserId`
  ) as Promise<ListMemorandumResponse>;
}

export function deleteMemorandumById(
  id: string,
  userId: string
): Promise<IResponse> {
  return deleteRequest(
    axiosInstance,
    `/memorandum/${id}/${userId}/deleteMemorandumById`
  ) as Promise<IResponse>;
}
