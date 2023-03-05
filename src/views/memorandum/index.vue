<script lang="ts" setup>
import { CopyDocument, Delete } from "@element-plus/icons-vue";
import { nextTick, onMounted, onBeforeUnmount, ref } from "vue";
import {
  IMemorandum,
  listMemorandumByUserId,
  ContentTypeEnum,
  deleteMemorandumById,
} from "../../api/services";
import { getCookie, removeCookie } from "../../assets/tools";
import { copyToClipboard } from "../../assets/tools/commonFunction";
import env from "../../assets/env";
import router from "../../router";
import { ElMessage } from "element-plus";

enum LinkStatusEnum {
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

const linkStatus = ref<LinkStatusEnum>(LinkStatusEnum.loading);
const linkMessage = ref<string>("服务器连接中...");

// 是否禁止发送消息
const disabledSend = ref(true);

const heartbeatTimer = ref<number>();

const sendTimeoutTimer = ref<number>();
const handleSendTimeout = () => {
  sendTimeoutTimer.value = setTimeout(() => {
    handleLinkStatus(LinkStatusEnum.failure);
  }, 5000);
};
// 心跳检查 30s一次
const heartbeatCheck = () => {
  heartbeatTimer.value = setInterval(() => {
    try {
      ws.value?.send(WebSocketOperationTypeEnum.heartbeat);
      handleSendTimeout();
    } catch (error) {
      handleLinkStatus(LinkStatusEnum.failure);
    }
  }, 30000);
};

const handleLinkStatus = (status: LinkStatusEnum, code?: number) => {
  linkStatus.value = status;
  switch (status) {
    case LinkStatusEnum.success:
      linkMessage.value = "已连接到服务器";
      disabledSend.value = false;
      heartbeatCheck();
      break;
    case LinkStatusEnum.failure:
      linkMessage.value = "服务器连接断开，请刷新后重试";
      disabledSend.value = true;
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

const memorandumListRef = ref<HTMLDivElement>();
const inputRef = ref<HTMLInputElement>();
// 自动滚动到底部
const memorandumContentScrollBottom = () => {
  nextTick(() => {
    const memorandumListEl = memorandumListRef.value;
    if (memorandumListEl) {
      memorandumListEl.scrollTop =
        memorandumListEl.scrollHeight - memorandumListEl.clientHeight;
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
      memorandumContentScrollBottom();
    } else {
      handleLinkStatus(LinkStatusEnum.failure, res.code);
    }
  }
};
// WebSocket连接成功
const onOpen = () => {
  handleLinkStatus(LinkStatusEnum.success);
  clearTimeout(sendTimeoutTimer.value);
  if (ws.value) {
    ws.value.onmessage = onMessage;
    ws.value.onclose = () => handleLinkStatus(LinkStatusEnum.failure);
  }
};
// WebSocket连接服务器
const connectWebSocket = () => {
  const token = getCookie("token");
  ws.value = new WebSocket(env.WS_URL, token);
  handleSendTimeout();
  ws.value.onopen = onOpen;
  ws.value.onerror = () => handleLinkStatus(LinkStatusEnum.failure);
};
const getMessageBody = (value: string) => {
  if (value.startsWith("[") && value.endsWith(")") && value.indexOf("](") !== -1) {
    contentType.value = ContentTypeEnum.link
    return value.substring(1, value.length - 1).replace("](", ",")
  }
  contentType.value = ContentTypeEnum.text
  return value

}
// 发送消息
const sendMessage = () => {
  if (content.value.trim()) {
    const messageBody = getMessageBody(content.value.trim())
    const data = {
      content: getMessageBody(content.value.trim()),
      contentType: contentType.value,
    };
    ws.value?.send(JSON.stringify(data));
    handleSendTimeout();
    content.value = "";
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
};
// 初始加载获取消息列表
const messageList = ref<Array<IMemorandum>>([]);
const getMessageList = (userId: string) => {
  listMemorandumByUserId(userId)
    .then((res) => {
      if (res.data) {
        messageList.value = res.data;
        memorandumContentScrollBottom();
      }
      connectWebSocket();
    })
    .catch(() => {
      handleLinkStatus(LinkStatusEnum.failure);
    });
};

onMounted(() => {
  const userId = getCookie("userId");
  if (userId) {
    getMessageList(userId);
  }
});

onBeforeUnmount(() => {
  ws.value && ws.value.close()
  clearInterval(heartbeatTimer.value);
});

const contentType = ref<ContentTypeEnum>(ContentTypeEnum.text);
const content = ref<string>("");

const deleteMessage = (content: IMemorandum) => {
  if (content.id && content.userId) {
    deleteMemorandumById(content.id, content.userId).then(() => {
      ElMessage.success("删除成功")
    })
  }
}
</script>
<template>
  <div class="memorandum-container">
    <div class="memorandum-box">
      <header class="memorandum-header" :class="linkStatus">
        {{ linkMessage }}
      </header>
      <main ref="memorandumListRef" class="memorandum-main">
        <p class="content-box" v-for="item in messageList" :key="item.id">
          <span
            v-if="item.contentType === ContentTypeEnum.text"
          >
            {{ item.content }}
          </span>
          <a
            v-if="item.contentType === ContentTypeEnum.link"
            :href="item.content.split(',')[1]"
            target="_blank"
            >{{ item.content.split(",")[0] }}
          </a>
          <div class="memorandum-operation">
            <el-button
              class="copy-btn"
              size="small"
              :icon="CopyDocument"
              circle
              @click="copyToClipboard(item.content)"
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
      <footer class="memorandum-footer">
        <el-input
          ref="inputRef"
          placeholder="链接格式：[文本](链接地址)&#13;&#10;CTRL+ENTER发送消息"
          :disabled="disabledSend"
          v-model="content"
          :rows="3"
          type="textarea"
          @keyup.ctrl.enter="sendMessage()"
        />
        <div class="operation">
          <el-button
            :disabled="disabledSend"
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
.memorandum-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  .memorandum-box {
    width: 100%;
    height: 100%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    border: 1px solid gray;
    .memorandum-header {
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
    .memorandum-main {
      flex: 1;
      overflow-y: auto;
      padding: 0 12px;
      .content-box {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        line-height: 1.5em;
        padding: 1em 1.5em;
        background-color: #f5f5f5;
        border-radius: 1em;
        white-space: pre-wrap;
        word-break: break-all;
        .memorandum-operation {
          flex: none;
          .copy-btn {
            flex: none;
            margin-left: 1em;
          }

        }
      }
    }
    .memorandum-footer {
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
