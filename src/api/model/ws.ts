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
  senderId: string;
  receiverId: string;
  messageList: IMessage[];
}

export interface ISendMessageData {
  senderId: string;
  receiverId: string;
  messageList: IMessage[];
}
