/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import router from "@/router";
import { ElMessage } from "element-plus";
import useCommonStore from "@/store/common";
import { toLoginPage } from "@/assets/tools";
import { IRequestData, IRequestParams, IResponse } from "./model";

// abort request
export const abortController = {
  value: new AbortController(),
  abort: () => {
    abortController.value.abort();
    abortController.value = new AbortController();
  },
};

const defaultInstance = axios.create({
  timeout: 60000,
  withCredentials: true,
});
defaultInstance.interceptors.request.use((config) => {
  const commonStore = useCommonStore();
  if (commonStore.abortRequest) {
    config.signal = abortController.value.signal;
  }
  return config;
});
defaultInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 默认异常处理器
 * @param {AxiosError} error 响应错误
 */
function defaultErrorHandler(error: AxiosError) {
  if (!error.response) {
    switch (error.code) {
      case "ERR_CANCELED":
        break;
      case "ERR_NETWORK":
        abortController.abort();
        ElMessage.error({
          message: "网络异常",
        });
        break;
      default:
        router.push("/error/other");
        break;
    }
  } else {
    const response = error.response as IResponse;
    switch (response.status) {
      case 400:
        ElMessage.error({
          message: response?.data?.message,
        });
        break;
      case 401:
        toLoginPage(response.data.message);
        break;
      case 404:
        router.push("/error/404");
        break;
      case 500:
      case 503:
      case 504:
        router.push("/error/" + response.status);
        break;
      default:
        router.push("/error/other");
        break;
    }
  }
}

/**
 *
 * @param error axios错误
 * @param customErrorHandler 自定义错误处理器；可以根据业务处理指定的错误，其他的异常情况交给默认错误处理器处理；捕获并成功处理错误后必须返回true，用来终止默认错误处理
 * @param enableDefaultErrorHandler 是否使用默认的错误处理器，默认为true
 */
export function errorHandler(
  error: AxiosError,
  customErrorHandler: ((error: AxiosError) => boolean | void) | boolean = false,
  enableDefaultErrorHandler = true
) {
  if (
    !(
      customErrorHandler &&
      typeof customErrorHandler === "function" &&
      customErrorHandler(error)
    ) &&
    enableDefaultErrorHandler
  ) {
    defaultErrorHandler(error);
  }
}

/**
 * 请求包装器
 * @param businessRequest 业务请求
 * @param enableGlobalLoading 是否开启全局加载效果，默认开启
 * @param enableAbortRequestWhenError 是否开启错误发生后终止全部请求，默认开启
 * @param customErrorHandler 自定义错误处理器
 * 入参为false时：使用默认错误处理器（默认）;
 * 入参为true时：不做任何错误处理；
 * 入参为函数时：首先使用自定义错误处理器处理，若自定义异常处理器返回false，交由默认错误处理器处理；
 */
export async function requestWrapper(
  businessRequest: () => Promise<any>,
  enableGlobalLoading = true,
  enableAbortRequestWhenError = true,
  customErrorHandler: ((error: AxiosError) => boolean | void) | boolean = false
) {
  if (!navigator.onLine) {
    return ElMessage.error("网络异常，请稍后重试");
  }
  const commonStore = useCommonStore();
  enableGlobalLoading && commonStore.enableGlobalLoading();
  enableAbortRequestWhenError && commonStore.enableAbortRequest();
  try {
    return await businessRequest();
  } catch (error) {
    enableAbortRequestWhenError && abortController.abort();
    if (customErrorHandler && typeof customErrorHandler === "boolean") {
      return error;
    }
    errorHandler(error as AxiosError, customErrorHandler);
  } finally {
    commonStore.disableAll();
  }
}
export function getRequest(
  url: string,
  params?: IRequestParams,
  config: AxiosRequestConfig = {},
  instance = defaultInstance
) {
  return instance.get(url, {
    ...config,
    params,
  });
}

export function postRequest(
  url: string,
  data: IRequestData,
  config: AxiosRequestConfig = {},
  instance = defaultInstance
) {
  return instance.post(url, data, config);
}

export function deleteRequest(
  url: string,
  params?: IRequestParams,
  config: AxiosRequestConfig = {},
  instance = defaultInstance
) {
  return instance.delete(url, {
    ...config,
    params,
  });
}

export function putRequest(
  url: string,
  data: IRequestData,
  config: AxiosRequestConfig = {},
  instance = defaultInstance
) {
  return instance.put(url, data, config);
}
