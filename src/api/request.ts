import axios, { AxiosError, AxiosInstance } from "axios";
import { ElMessage } from "element-plus";
import { removeCookie } from "../assets/tools";
import router from "../router";

const axiosInstance = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

function toLoginPage() {
  removeCookie("userId")
  removeCookie("token")
  router.replace({ path: "/login" })
}

function handleResponseError(error: AxiosError) {
  const response = error.response
  if (response) {
    const data = response.data as IResponse
    switch (response.status) {
      case 401:
        ElMessage.error(data.message)
        toLoginPage()
        break;
      case 500: 
        ElMessage.error("服务器连接失败")
        break;
      default:
        ElMessage.error(data.message)
        break;
    }
  }
}

axiosInstance.interceptors.response.use(
  (response) => {
    if (response.status === 200) {
      return response.data;
    } else {
      return Promise.reject({ response })
    }
  },
  (error: AxiosError) => {
    handleResponseError(error)
    return Promise.reject(error)
  }
);


export interface IRequestParams {
  [prop: string]: any;
}
export interface IResponse {
  message?: string;
  data?: any;
  [prop: string]: any;
}

export function getRequest(
  instance: AxiosInstance,
  url: string,
  data: IRequestParams = {}
) {
  return new Promise((resolve, reject) => {
    instance
      .get(url, {
        params: data,
      })
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function postRequest(
  instance: AxiosInstance,
  url: string,
  data: IRequestParams = {}
) {
  return new Promise((resolve, reject) => {
    instance
      .post(url, data)
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function deleteRequest(
  instance: AxiosInstance,
  url: string,
  data: IRequestParams = {}
) {
  return new Promise((resolve, reject) => {
    instance
      .delete(url, {
        params: data,
      })
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function putRequest(
  instance: AxiosInstance,
  url: string,
  data: IRequestParams = {}
) {
  return new Promise((resolve, reject) => {
    instance
      .put(url, data)
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export default axiosInstance;
