import { AxiosResponse } from "axios";
import { BaseService, IResponseData } from "../model";
import { getRequest } from "../request";

export enum ReadStatusEnum {
  read = "read",
  unread = "unread",
}

export interface IMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  readStatus: ReadStatusEnum;
  createTime: Date;
}

export interface IListMessageResponseData extends IResponseData {
  data: {
    hasPrev: boolean;
    messageList: Array<IMessage>;
  };
}

class Message extends BaseService {
  listMessageByFriendId(friendId: string, prevMessageId?: string) {
    const params = prevMessageId ? { prevMessageId } : undefined;
    return getRequest(
      this.baseUrl + `/${friendId}/listMessage`,
      params
    ) as Promise<AxiosResponse<IListMessageResponseData>>;
  }
}

export default Message;
