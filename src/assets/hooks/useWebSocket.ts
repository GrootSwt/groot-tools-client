import { getCookie, toLoginPage } from "@/assets/tools";
import env from "@/assets/env";
import {
  IWSResponseData,
  IWSResponse,
  LinkStatusEnum,
  WSOperationTypeEnum,
} from "@/api/model";
import useWSStore from "@/store/ws";

export function useWebSocket(
  url: string,
  receiveMessage: (response: IWSResponse<IWSResponseData>) => void,
  needReConnect: Ref<boolean>,
  linkSuccess?: () => void,
  linkFailure?: () => void,
  reConnectWebSocketCallback?: (single?: AbortSignal) => void
) {
  const wsStore = useWSStore();
  /**
   * WebSocket处理
   */
  const ws = ref<WebSocket>();
  // 连接
  function onConnectWebSocket() {
    const token = getCookie("token");
    ws.value = new WebSocket(env.WS_URL + url, token);
    wsStore.onChangeLinkInfo(LinkStatusEnum.loading, "连接中...");
    startLinkStatusCheck();
    ws.value.onopen = onOpenHandler;
    ws.value.onerror = onErrorHandler;
    ws.value.onmessage = onReceiveMessage;
  }
  // 连接成功处理器
  function onOpenHandler() {
    clearLinkStatusCheck();
    linkStatusHandler(LinkStatusEnum.success);
  }
  // 连接失败处理器
  function onErrorHandler() {
    linkStatusHandler(LinkStatusEnum.failure);
  }
  // 发送消息
  function onSendMessage(data: string) {
    try {
      startLinkStatusCheck();
      ws.value?.send(data);
    } catch (error) {
      clearLinkStatusCheck();
      linkStatusHandler(LinkStatusEnum.failure);
    }
  }
  // 接收消息
  function onReceiveMessage(messageEvent: MessageEvent) {
    clearLinkStatusCheck();
    if (messageEvent.data === WSOperationTypeEnum.heartbeat) {
      return;
    }
    const response = JSON.parse(
      messageEvent.data
    ) as IWSResponse<IWSResponseData>;
    if (response.status === 200) {
      receiveMessage(response);
    } else {
      linkStatusHandler(
        LinkStatusEnum.failure,
        response.status,
        response.message
      );
    }
  }

  const linkStatusCheckTimer = ref<number>();
  // 开启连接状态检查
  function startLinkStatusCheck() {
    linkStatusCheckTimer.value = setTimeout(() => {
      linkStatusHandler(LinkStatusEnum.failure);
    }, 5000);
  }
  // 清除连接状态检查
  function clearLinkStatusCheck() {
    clearTimeout(linkStatusCheckTimer.value);
  }
  // 连接状态处理器
  function linkStatusHandler(
    status: LinkStatusEnum,
    code?: number,
    message?: string
  ) {
    switch (status) {
      case LinkStatusEnum.success:
        wsStore.onChangeLinkInfo(status, "已连接");
        startHeartbeatCheck();
        linkSuccess && linkSuccess();
        break;
      case LinkStatusEnum.failure:
        wsStore.onChangeLinkInfo(status, "连接断开，请刷新");
        linkFailure && linkFailure();
        ws.value?.close();
        ws.value = undefined;
        clearHeartbeatCheck();
        break;
      default:
        break;
    }
    if (code === 401) {
      toLoginPage(message);
    }
  }

  /**
   * 心跳检测
   */
  const heartbeatCheckTimer = ref<number>();
  // 开始心跳检测
  function startHeartbeatCheck() {
    heartbeatCheckTimer.value = setInterval(() => {
      try {
        ws.value?.send(WSOperationTypeEnum.heartbeat);
        clearLinkStatusCheck();
      } catch (error) {
        linkStatusHandler(LinkStatusEnum.failure);
      }
    }, 30000);
  }
  // 清除心跳检测
  function clearHeartbeatCheck() {
    clearInterval(heartbeatCheckTimer.value);
  }

  /**
   * 关闭ws连接和停止连接状态检查和心跳检测
   */
  function closeAll() {
    ws.value?.close();
    ws.value = undefined;
    clearLinkStatusCheck();
    clearHeartbeatCheck();
    wsStore.onChangeLinkInfo(LinkStatusEnum.failure, "连接断开，请刷新");
  }

  /**
   * 重连websocket
   */
  function reConnectWebSocket() {
    onConnectWebSocket();
    reConnectWebSocketCallback && reConnectWebSocketCallback();
  }

  function onVisibilityChange() {
    if (document.visibilityState === "visible") {
      needReConnect.value && reConnectWebSocket();
    } else {
      closeAll();
    }
  }

  document.addEventListener("visibilitychange", onVisibilityChange);

  onBeforeUnmount(() => {
    closeAll();
    document.removeEventListener("visibilitychange", onVisibilityChange);
  });

  return {
    onConnectWebSocket,
    onSendMessage,
    linkStatusHandler,
  };
}
