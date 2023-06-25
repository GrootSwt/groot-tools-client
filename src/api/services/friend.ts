import { BaseService, IResponseData } from "../model";
import { getRequest } from "../request";

export interface IFriend {
  id: string;
  userId: string;
  friendId: string;
  account: string;
  displayName?: string;
  phoneNumber?: string;
  commentName?: string;
}
export interface IFriendWithUnreadMsgCount extends IFriend {
  unreadMessageCount?: number;
}

export interface IListFriendResponse extends IResponseData {
  data: Array<IFriend>;
}

export interface IListFriendWithUnreadMsgCountResponse extends IResponseData {
  data: Array<IFriendWithUnreadMsgCount>;
}

class Friend extends BaseService {
  listFriend() {
    return getRequest(
      this.baseUrl + "/listFriend"
    ) as Promise<IListFriendResponse>;
  }
  listFriendWithUnreadMsgCount() {
    return getRequest(
      this.baseUrl + "/listFriendWithUnreadMsgCount"
    ) as Promise<IListFriendWithUnreadMsgCountResponse>;
  }
}

export default Friend;
