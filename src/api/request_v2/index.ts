import {
  UseRequestWrapperConfig,
  useRequestWrapper,
} from "./useRequestWrapper";

const config: UseRequestWrapperConfig = {
  createAxiosDefaults: {
    timeout: 60 * 1000,
    withCredentials: true,
  },
  nonResponseErrorDefaultHandler: async (error) => {
    // TODO
    console.error(error);
  },
  responseErrorDefaultHandler: async (response) => {
    // TODO
    console.error(response);
  },
};

const { requestWrapper, getRequest, postRequest, putRequest, deleteRequest } =
  useRequestWrapper(config);

export { requestWrapper, getRequest, postRequest, putRequest, deleteRequest };
