import { AxiosResponse } from "axios";
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

export interface IListFriendResponseData extends IResponseData {
  data: Array<IFriend>;
}

export interface IListFriendWithUnreadMsgCountResponseData
  extends IResponseData {
  data: Array<IFriendWithUnreadMsgCount>;
}

class Friend extends BaseService {
  listFriend() {
    return getRequest(this.baseUrl + "/listFriend") as Promise<
      AxiosResponse<IListFriendResponseData>
    >;
  }
  listFriendWithUnreadMsgCount() {
    return getRequest(
      this.baseUrl + "/listFriendWithUnreadMsgCount"
    ) as Promise<AxiosResponse<IListFriendWithUnreadMsgCountResponseData>>;
  }
}

export default Friend;
