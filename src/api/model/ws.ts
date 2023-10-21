import { IMemorandum, IMessage } from "../services";

export enum LinkStatusEnum {
  unConnect = "unConnect",
  loading = "loading",
  failure = "failure",
  success = "success",
}

export enum WSOperationTypeEnum {
  heartbeat = "heartbeat",
  chat_read = "read",
  chat_send = "send",
  memorandum_append = "append",
  memorandum_replace = "replace",
}

export interface IWSResponseData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;
}

export interface IWSResponse<T> {
  status: number;
  message: string;
  operationType: WSOperationTypeEnum;
  data: T;
}

export interface IMessageReadData extends IWSResponseData {
  friendId: string;
  readMessageIds: string[];
  unreadCount: number;
}
export interface ISendMessageData extends IWSResponseData {
  friendId: string;
  message: IMessage;
  unreadMessageCount: number;
}

export interface IMemorandumData extends IMemorandum, IWSResponseData {}
