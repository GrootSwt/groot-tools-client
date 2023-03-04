<script lang="ts" setup>
import { CopyDocument, Delete } from "@element-plus/icons-vue";
import { nextTick, onMounted, onBeforeUnmount, ref } from "vue";
import {
  IMessage,
  listMessageByUserId,
  MessageTypeEnum,
  deleteMessageById,
} from "../../api/services";
import { getCookie, removeCookie } from "../../assets/tools";
import { copyToClipboard } from "../../assets/tools/commonFunction";
import env from "../../assets/env";
import router from "../../router";
import { ElMessage } from "element-plus";

enum HeaderStatusEnum {
  loading = "loading",
  failure = "failure",
  success = "success",
}

enum WebSocketOperationTypeEnum {
  append = "append",
  replace = "replace",
  heartbeat = "heartbeat",
}

const ws = ref<WebSocket>();

const headerStatus = ref<HeaderStatusEnum>(HeaderStatusEnum.loading);
const headerMessage = ref<string>("服务器连接中...");

// 是否禁止发送消息
const disabledSendMessage = ref(true);

const heartbeatTimer = ref<number>();

const sendTimeoutTimer = ref<number>();
const handleSendTimeout = () => {
  sendTimeoutTimer.value = setTimeout(() => {
    handleChatStatus(HeaderStatusEnum.failure);
  }, 5000);
};
// 心跳检查 30s一次
const heartbeatCheck = () => {
  heartbeatTimer.value = setInterval(() => {
    try {
      ws.value?.send(WebSocketOperationTypeEnum.heartbeat);
      handleSendTimeout();
    } catch (error) {
      handleChatStatus(HeaderStatusEnum.failure);
    }
  }, 30000);
};

const handleChatStatus = (status: HeaderStatusEnum, code?: number) => {
  headerStatus.value = status;
  switch (status) {
    case HeaderStatusEnum.success:
      headerMessage.value = "已连接到服务器";
      disabledSendMessage.value = false;
      heartbeatCheck();
      break;
    case HeaderStatusEnum.failure:
      headerMessage.value = "服务器连接断开，请刷新后重试";
      disabledSendMessage.value = true;
      clearInterval(heartbeatTimer.value);
      ws.value?.close();
      ws.value = undefined;
    default:
      break;
  }
  if (code === 401) {
    removeCookie("token");
    removeCookie("userId");
    router.replace({ path: "/login" });
  }
};

const chatContentRef = ref<HTMLDivElement>();
const inputRef = ref<HTMLInputElement>();
// 自动滚动到底部
const chatContentScrollBottom = () => {
  nextTick(() => {
    const chatContentEl = chatContentRef.value;
    if (chatContentEl) {
      chatContentEl.scrollTop =
        chatContentEl.scrollHeight - chatContentEl.clientHeight;
    }
  });
};
// WebSocket接收消息
const onMessage = (e: MessageEvent) => {
  clearTimeout(sendTimeoutTimer.value);
  if (e.data) {
    if (e.data === WebSocketOperationTypeEnum.heartbeat) {
      return;
    }
    const res = JSON.parse(e.data);
    if (res.code === 200) {
      const data = res.data;
      // 消息列表
      if (res.operationType === WebSocketOperationTypeEnum.replace) {
        messageList.value = data;
      } else if (res.operationType === WebSocketOperationTypeEnum.append) {
        // 单条消息
        messageList.value.push(data);
      }
      // 滚动到底部
      chatContentScrollBottom();
    } else {
      handleChatStatus(HeaderStatusEnum.failure, res.code);
    }
  }
};
// WebSocket连接成功
const onOpen = () => {
  handleChatStatus(HeaderStatusEnum.success);
  clearTimeout(sendTimeoutTimer.value);
  if (ws.value) {
    ws.value.onmessage = onMessage;
    ws.value.onclose = () => handleChatStatus(HeaderStatusEnum.failure);
  }
};
// WebSocket连接服务器
const connectWebSocket = () => {
  const token = getCookie("token");
  ws.value = new WebSocket(env.WS_URL, token);
  handleSendTimeout();
  ws.value.onopen = onOpen;
  ws.value.onerror = () => handleChatStatus(HeaderStatusEnum.failure);
};
const getMessageBody = (value: string) => {
  if (value.startsWith("[") && value.endsWith(")") && value.indexOf("](") !== -1) {
    messageType.value = MessageTypeEnum.link
    return value.substring(1, value.length - 1).replace("](", ",")
  }
  messageType.value = MessageTypeEnum.text
  return value

}
// 发送消息
const sendMessage = () => {
  if (message.value.trim()) {
    const messageBody = getMessageBody(message.value.trim())
    const data = {
      message: getMessageBody(message.value.trim()),
      messageType: messageType.value,
    };
    ws.value?.send(JSON.stringify(data));
    handleSendTimeout();
    message.value = "";
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
};
// 初始加载获取消息列表
const messageList = ref<Array<IMessage>>([]);
const getMessageList = (userId: string) => {
  listMessageByUserId(userId)
    .then((res) => {
      if (res.data) {
        messageList.value = res.data;
        chatContentScrollBottom();
      }
      connectWebSocket();
    })
    .catch(() => {
      handleChatStatus(HeaderStatusEnum.failure);
    });
};

onMounted(() => {
  const userId = getCookie("userId");
  if (userId) {
    getMessageList(userId);
  }
});

onBeforeUnmount(() => {
  clearInterval(heartbeatTimer.value);
});

const messageType = ref<MessageTypeEnum>(MessageTypeEnum.text);
const message = ref<string>("");
const toggleMessageType = () => {
  if (messageType.value === MessageTypeEnum.text) {
    messageType.value = MessageTypeEnum.link;
  } else {
    messageType.value = MessageTypeEnum.text;
  }
  inputRef.value?.focus();
};

const deleteMessage = (info: IMessage) => {
  if (info.id && info.userId) {
    deleteMessageById(info.id, info.userId).then((res) => {
      ElMessage.success("删除成功")
    })
  }
}
</script>
<template>
  <div class="chat-container">
    <div class="chat-box">
      <header class="chat-header" :class="headerStatus">
        {{ headerMessage }}
      </header>
      <main ref="chatContentRef" class="chat-main">
        <p class="message-box" v-for="item in messageList" :key="item.id">
          <span
            v-if="item.messageType === MessageTypeEnum.text"
          >
            {{ item.message }}
          </span>
          <a
            v-if="item.messageType === MessageTypeEnum.link"
            :href="item.message.split(',')[1]"
            target="_blank"
            >{{ item.message.split(",")[0] }}
          </a>
          <div class="chat-operation">
            <el-button
              class="copy-btn"
              size="small"
              :icon="CopyDocument"
              circle
              @click="copyToClipboard(item.message)"
            />
            <el-button
              class="copy-btn"
              size="small"
              :icon="Delete"
              circle
              @click="deleteMessage(item)"
            />
          </div>
        </p>
      </main>
      <footer class="chat-footer">
        <el-input
          ref="inputRef"
          placeholder="链接格式：[文本](链接地址)&#13;&#10;CTRL+ENTER发送消息"
          :disabled="disabledSendMessage"
          v-model="message"
          :rows="3"
          type="textarea"
          @keyup.ctrl.enter="sendMessage()"
        />
        <div class="operation">
          <el-button
            :disabled="disabledSendMessage"
            class="send-btn"
            @click="sendMessage()"
          >
            发送
          </el-button>
        </div>
      </footer>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.chat-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  .chat-box {
    width: 100%;
    height: 100%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    border: 1px solid gray;
    .chat-header {
      flex: none;
      text-align: center;
      line-height: 180%;
      border-bottom: 1px solid gray;
      &.loading {
        color: #1a94fa;
      }
      &.failure {
        color: #fe6164;
      }
      &.success {
        color: #50ba3e;
      }
    }
    .chat-main {
      flex: 1;
      overflow-y: auto;
      padding: 0 12px;
      .message-box {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        line-height: 1.5em;
        padding: 1em 1.5em;
        background-color: #f5f5f5;
        border-radius: 1em;
        white-space: pre-wrap;
        word-break: break-all;
        .chat-operation {
          flex: none;
          .copy-btn {
            flex: none;
            margin-left: 1em;
          }

        }
      }
    }
    .chat-footer {
      flex: none;
      display: flex;
      border-top: 1px solid gray;
      :deep(.el-textarea__inner) {
        resize: none;
        border: none;
        box-shadow: none;
        border-radius: 0;
      }
      .operation {
        position: relative;
        display: flex;
        flex-direction: column;
        border-left: 1px solid gray;
        margin-left: 4px;
        .split-line {
          position: absolute;
          width: 100%;
          height: 1px;
          background-color: gray;
          top: calc(50% - 1px);
        }
        .el-button {
          border: none;
          margin-left: 0;
          border-radius: 0;
          height: 100%;
        }
      }
    }
  }
}
</style>
