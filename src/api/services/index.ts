import env from "@/assets/env";
import { Login } from "./login";
import { Memorandum } from "./memorandum";

export * from "./login";
export * from "./memorandum";

const baseUrl = env.BASE_URL;

const service = {
  login: new Login(baseUrl),
  memorandum: new Memorandum(baseUrl),
};

export default service;
