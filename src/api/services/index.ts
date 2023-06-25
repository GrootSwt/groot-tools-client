export * from "./login";
export * from "./memorandum";
export * from "./friend";
export * from "./message";

import env from "@/assets/env";
import Login from "./login";
import Memorandum from "./memorandum";
import Friend from "./friend";
import Message from "./message";

const baseUrl = env.BASE_URL;

const service = {
  login: new Login(baseUrl),
  memorandum: new Memorandum(baseUrl),
  friend: new Friend(baseUrl + "/friend"),
  message: new Message(baseUrl + "/message"),
};

export default service;
