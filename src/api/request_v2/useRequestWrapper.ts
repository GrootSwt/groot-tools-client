import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
  InternalAxiosRequestConfig,
} from "axios";

export type UseRequestWrapperConfig = {
  fullScreenLoadingConfig?: {
    openFullscreenLoading: () => Promise<void>;
    closeFullscreenLoading: () => Promise<void>;
  };
  // axios实例化默认配置
  createAxiosDefaults?: CreateAxiosDefaults;
  // 请求拦截器前置处理器
  requestInterceptorPreHandler?: (
    config: InternalAxiosRequestConfig
  ) => Promise<InternalAxiosRequestConfig>;
  // 响应拦截器前置处理器
  responseInterceptorPreHanlder?: (
    response: AxiosResponse
  ) => Promise<AxiosResponse>;
  // 非响应错误处理器
  nonResponseErrorDefaultHandler: (error: AxiosError) => Promise<void>;
  // 响应错误处理器
  responseErrorDefaultHandler: (response: AxiosResponse) => Promise<void>;
  // 请求包装器前置处理器（例如：网络异常、登录状态校验等处理）
  requestWrapperPreHandler?: () => Promise<boolean>;
  // 请求包装器配置默认配置
  requestWrapperConfigDefaults?: RequestWrapperConfig;
};

export type RequestWrapperConfig = {
  // 全屏加载
  fullscreenLoading?: boolean;
  // 当请求包装器中有错误发生时，终止其他请求
  abortController?: AbortController;
  // 禁用默认错误处理器，使用自定义错误处理
  customErrorHandler?: (error: AxiosError) => Promise<boolean> | boolean;
};

/**
 * 请求处理器生成器
 * @param useRequestWrapperConfig 请求处理器生成器配置
 * @returns 请求处理器
 */
export function useRequestWrapper(
  useRequestWrapperConfig: UseRequestWrapperConfig
) {
  const {
    fullScreenLoadingConfig,
    createAxiosDefaults,
    requestInterceptorPreHandler,
    responseInterceptorPreHanlder,
    requestWrapperPreHandler,
    requestWrapperConfigDefaults,
    nonResponseErrorDefaultHandler,
    responseErrorDefaultHandler,
  } = useRequestWrapperConfig;

  const axiosInstance = axios.create(createAxiosDefaults);

  axiosInstance.interceptors.request.use(async (config) => {
    if (requestInterceptorPreHandler) {
      return await requestInterceptorPreHandler(config);
    }
    return config;
  });

  axiosInstance.interceptors.response.use(
    async (response) => {
      if (responseInterceptorPreHanlder) {
        return await responseInterceptorPreHanlder(response);
      }
      return response;
    },
    (error) => {
      throw error;
    }
  );

  /**
   * 请求包装器
   * @param businessRequest 业务请求
   * @param requestWrapperConfig 请求包装器配置项
   * @returns 业务请求结果
   */
  async function requestWrapper(
    businessRequest: () => Promise<unknown>,
    requestWrapperConfig?: RequestWrapperConfig
  ) {
    const { fullscreenLoading, abortController, customErrorHandler } =
      requestWrapperConfig ||
        requestWrapperConfigDefaults || {
          fullscreenLoading: false,
        };
    try {
      if (requestWrapperPreHandler && !(await requestWrapperPreHandler())) {
        return;
      }
      if (fullscreenLoading && fullScreenLoadingConfig) {
        await fullScreenLoadingConfig.openFullscreenLoading();
      }
      return await businessRequest();
    } catch (error) {
      const axiosError = error as AxiosError;
      if (abortController) {
        abortController.abort();
      }
      if (
        customErrorHandler &&
        ((typeof customErrorHandler === "function" &&
          (await customErrorHandler(error as AxiosError))) ||
          typeof customErrorHandler === "boolean")
      ) {
        return;
      }

      if (axiosError.response) {
        return await responseErrorDefaultHandler(axiosError.response);
      }
      return await nonResponseErrorDefaultHandler(axiosError);
    } finally {
      if (fullscreenLoading && fullScreenLoadingConfig) {
        await fullScreenLoadingConfig.closeFullscreenLoading();
      }
    }
  }

  function getRequest(
    url: string,
    params?: unknown,
    config: AxiosRequestConfig = {}
  ) {
    return axiosInstance.get(url, {
      ...config,
      params,
    });
  }

  function postRequest(
    url: string,
    data: unknown,
    config: AxiosRequestConfig = {}
  ) {
    return axiosInstance.post(url, data, config);
  }

  function deleteRequest(
    url: string,
    params?: unknown,
    data?: unknown,
    config: AxiosRequestConfig = {}
  ) {
    return axiosInstance.delete(url, {
      ...config,
      params,
      data,
    });
  }

  function putRequest(
    url: string,
    data: unknown,
    config: AxiosRequestConfig = {}
  ) {
    return axiosInstance.put(url, data, config);
  }

  return {
    requestWrapper,
    getRequest,
    postRequest,
    putRequest,
    deleteRequest,
  };
}
