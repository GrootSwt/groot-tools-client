<script lang="ts" setup>
import { CopyDocument } from "@element-plus/icons-vue";
import { onMounted, ref } from "vue";
import {
  IMessage,
  listMessageByUserId,
  MessageTypeEnum,
} from "../api/services";
import { getCookie } from "../assets/tools";
import { copyToClipboard } from "../assets/tools/commonFunction";
import env from "../assets/env";
import { ElMessage } from "element-plus";

const disabledSendMessage = ref(true);

const ws = ref<WebSocket>();
const connectWebSocket = () => {
  const token = getCookie("token");
  ws.value = new WebSocket(env.WS_URL, token);
  ws.value.onopen = (e) => {
    ElMessage.success("已连接到服务器，可以开始聊天");
    disabledSendMessage.value = false;
  };
  ws.value.onmessage = (e) => {
    if (e.data) {
      const data = JSON.parse(e.data);
      messageList.value.push(data);
    }
  };
  ws.value.onerror = () => {
    disabledSendMessage.value = true;
    ElMessage.error("聊天连接已断开，请刷新后重试");
  };
};

const sendMessage = () => {
  if (message.value) {
    const data = {
      message: message.value,
      messageType: messageType.value,
    };
    messageList.value.push(data);
    ws.value?.send(JSON.stringify(data));
    message.value = "";
  }
};

const messageList = ref<Array<IMessage>>([]);
const getMessageList = (userId: string) => {
  listMessageByUserId(userId)
    .then((res) => {
      if (res.data) {
        messageList.value = res.data;
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
      <main class="chat-main">
        <p class="message-box" v-for="item in messageList" :key="item.id">
          <span v-if="item.messageType === MessageTypeEnum.text">
            {{ item.message }}
          </span>
          <a
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
          :disabled="disabledSendMessage"
          v-model="message"
          :rows="3"
          type="textarea"
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
            >发送</el-button
          >
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
    @media screen and (max-width: 499px) {
      border: none;
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
        height: 0;
        border: 1px solid gray;
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
</style>
