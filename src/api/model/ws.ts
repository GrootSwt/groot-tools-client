import { IMessage } from "../services";

export enum LinkStatusEnum {
  loading = "loading",
  failure = "failure",
  success = "success",
}

export enum MemorandumOperationTypeEnum {
  heartbeat = "heartbeat",
  append = "append",
  replace = "replace",
}

export enum ChatOperationTypeEnum {
  heartbeat = "heartbeat",
  read = "read",
  send = "send",
}

export interface IWSResponse<T> {
  status: number;
  operationType: ChatOperationTypeEnum;
  data: T;
}

export interface IMessageReadData {
  friendId: string;
  readMessageIds: string[];
  unreadCount: number;
}

export interface ISendMessageData {
  friendId: string;
  message: IMessage;
  unreadMessageCount: number;
}
