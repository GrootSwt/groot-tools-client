import {
  UseRequestWrapperConfig,
  useRequestWrapper,
} from "./useRequestWrapper";
import router from "@/router";
import { ElMessage } from "element-plus";
import { toLoginPage } from "@/assets/tools";

const config: UseRequestWrapperConfig = {
  createAxiosDefaults: {
    timeout: 60 * 1000,
    withCredentials: true,
  },
  nonResponseErrorDefaultHandler: async (error) => {
    switch (error.code) {
      case "ERR_CANCELED":
        break;
      case "ERR_NETWORK":
        ElMessage.error({
          message: "网络异常",
        });
        break;
      default:
        router.push({
          path: "/error",
        });
        break;
    }
  },
  responseErrorDefaultHandler: async (response) => {
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
        router.push({
          path: "/error",
          query: {
            status: 404,
          },
        });
        break;
      case 500:
      case 503:
      case 504:
        router.push({
          path: "/error",
        });
        break;
      default:
        router.push({
          path: "/error",
        });
        break;
    }
  },
  requestWrapperPreHandler: async () => {
    if (!navigator.onLine) {
      ElMessage.error("网络异常，请稍后重试");
      return false;
    }
    return true;
  },
};

const { requestWrapper, getRequest, postRequest, putRequest, deleteRequest } =
  useRequestWrapper(config);

export { requestWrapper, getRequest, postRequest, putRequest, deleteRequest };
