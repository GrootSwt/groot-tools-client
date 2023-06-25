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
  account: string;
  displayName?: string;
  commentName?: string;
  content: string;
  readStatus: ReadStatusEnum;
}

export interface IListMessageByFriendIdResponse extends IResponseData {
  data: Array<IMessage>;
}

class Message extends BaseService {
  listMessageByFriendId(friendId: string) {
    return getRequest(
      this.baseUrl + `/${friendId}/listMessageByFriendId`
    ) as Promise<IListMessageByFriendIdResponse>;
  }
}

export default Message;
