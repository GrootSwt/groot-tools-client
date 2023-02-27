<script lang="ts" setup>
import { CopyDocument } from "@element-plus/icons-vue";
import { nextTick, onMounted, onBeforeUnmount, ref, computed } from "vue";
import {
  IMessage,
  listMessageByUserId,
  MessageTypeEnum,
} from "../api/services";
import { getCookie } from "../assets/tools";
import { copyToClipboard } from "../assets/tools/commonFunction";
import env from "../assets/env";

const HEARTBEAT = "heartbeat";
const heartbeatTimer = ref<number>();

enum HeaderStatusEnum {
  loading = "loading",
  failure = "failure",
  success = "success",
}
const headerStatus = ref<HeaderStatusEnum>(HeaderStatusEnum.loading);
const headerMessage = ref<string>("服务器连接中...");

const handleWSError = () => {
  headerStatus.value = HeaderStatusEnum.failure;
  headerMessage.value = "服务器连接已断开，请刷新后重试";
  disabledSendMessage.value = true;
  clearInterval(heartbeatTimer.value);
  ws.value = undefined;
};
const headerClass = computed(() => {
  return headerStatus.value;
});

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
// 是否禁止发送消息
const disabledSendMessage = ref(true);
// chat websocket
const ws = ref<WebSocket>();

const heartbeatCheck = () => {
  heartbeatTimer.value = setInterval(() => {
    try {
      ws.value?.send("heartbeat");
    } catch (error) {
      handleWSError();
    }
  }, 5000);
};
const onMessage = () => {
  if (ws.value) {
    ws.value.onmessage = (e) => {
      if (e.data) {
        if (e.data === HEARTBEAT) {
          return;
        }
        const data = JSON.parse(e.data);
        messageList.value.push(data);
      }
    };
  }
};
const onOpen = () => {
  headerStatus.value = HeaderStatusEnum.success;
  headerMessage.value = "已连接到服务器，可以开始聊天";
  disabledSendMessage.value = false;
  heartbeatCheck();
};
// 连接ws
const connectWebSocket = () => {
  const token = getCookie("token");
  ws.value = new WebSocket(env.WS_URL, token);
  ws.value.onopen = onOpen;
  ws.value.onmessage = onMessage;
  ws.value.onclose = handleWSError;
  ws.value.onerror = handleWSError;
};
// 发送消息
const sendMessage = () => {
  if (message.value.trim()) {
    const data = {
      message: message.value.trim(),
      messageType: messageType.value,
    };
    messageList.value.push(data);
    ws.value?.send(JSON.stringify(data));
    message.value = "";
    nextTick(() => {
      chatContentScrollBottom();
      inputRef.value?.focus();
    })
  }
};

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
    .catch(() => {});
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
};
</script>
<template>
  <div class="chat-container">
    <div class="chat-box">
      <header class="chat-header" :class="headerClass">
        {{ headerMessage }}
      </header>
      <main ref="chatContentRef" class="chat-main">
        <p class="message-box" v-for="item in messageList" :key="item.id">
          <span
            class="message"
            v-if="item.messageType === MessageTypeEnum.text"
          >
            {{ item.message }}
          </span>
          <a
            class="message"
            v-if="item.messageType === MessageTypeEnum.link"
            :href="item.message"
            target="_blank"
            >{{ item.message }}
          </a>
          <el-button
            class="copy-btn"
            size="small"
            :icon="CopyDocument"
            circle
            @click="copyToClipboard(item.message)"
          />
        </p>
      </main>
      <footer class="chat-footer">
        <el-input
          ref="inputRef"
          placeholder="点击ctrl+enter发送消息"
          :disabled="disabledSendMessage"
          v-model="message"
          :rows="3"
          type="textarea"
          @keyup.ctrl.enter="sendMessage()"
        />
        <div class="operation">
          <div class="split-line"></div>
          <el-button
            :disabled="disabledSendMessage"
            class="toggle-type-btn"
            @click="toggleMessageType()"
          >
            {{ messageType === MessageTypeEnum.text ? "文本" : "链接" }}
          </el-button>
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
        line-height: 1.5em;
        .message {
          word-break: break-all;
        }
        .copy-btn {
          flex: none;
          margin-left: 1em;
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
        justify-content: space-between;
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
          height: 50%;
        }
      }
    }
  }
}
</style>
