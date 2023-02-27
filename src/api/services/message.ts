import axiosInstance, { getRequest, IResponse } from "../request";

export enum MessageTypeEnum {
  text = "text",
  link = "link"
}

export interface IMessage {
  id?: string;
  userId?: string;
  message: string;
  messageType: MessageTypeEnum;
  createTime?: Date;
  updateTime?: Date;
}

export interface ListMessageResponse extends IResponse {
  data?: Array<IMessage>
}

export function listMessageByUserId(userId: string): Promise<ListMessageResponse> {
  return getRequest(axiosInstance, `/message/${userId}/listMessageByUserId`) as Promise<ListMessageResponse>
}