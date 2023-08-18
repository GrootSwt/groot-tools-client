<script lang="ts" setup>
import { CopyDocument, Delete } from "@element-plus/icons-vue";
import { nextTick, onMounted, ref } from "vue";
import service, { IMemorandum } from "../../api/services";
import { scrollToBottom } from "../../assets/tools";
import { copyToClipboard } from "../../assets/tools/common";
import { ElMessage } from "element-plus";
import { requestWrapper } from "@/api/request";
import {
  IResponseData,
  IWSResponse,
  LinkStatusEnum,
  WSOperationTypeEnum,
} from "@/api/model";
import { useWebSocket } from "@/assets/hooks";

const { onConnectWebSocket, onSendMessage, linkStatusHandler } = useWebSocket(
  "/memorandum",
  onWSMessage,
  () => {
    disabledSend.value = false;
  },
  () => {
    disabledSend.value = true;
  }
);
// 是否禁止发送消息
const disabledSend = ref(true);
const content = ref<string>("");
const memorandumListRef = ref<HTMLDivElement>();
const inputRef = ref<HTMLInputElement>();

// 自动滚动到底部
const memorandumContentScrollBottom = () => {
  nextTick(() => {
    const memorandumListEl = memorandumListRef.value;
    if (memorandumListEl) {
      scrollToBottom(memorandumListEl);
    }
  });
};
// WebSocket接收消息
function onWSMessage(response: IWSResponse<IResponseData>) {
  if (response.operationType === WSOperationTypeEnum.memorandum_replace) {
    messageList.value = response.data as IMemorandum[];
  } else if (response.operationType === WSOperationTypeEnum.memorandum_append) {
    messageList.value.push(response.data as IMemorandum);
  }
  // 滚动到底部
  memorandumContentScrollBottom();
}

const getMessageHTML = (value: string) => {
  const linkRule = /\[.+\]\(http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)*\)/g;
  const links = value.match(linkRule);
  if (links) {
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const splitIndex = link.indexOf("](");
      const title = link.substring(1, splitIndex);
      const href = link.substring(splitIndex + 2, link.length - 1);
      const replaceLink = `<a href="${href}" target="blank">${title}</a>`;
      value = value.replace(link, replaceLink);
    }
  }
  return value;
};
// 发送消息
const sendMessage = () => {
  const result = content.value.trim();
  if (result) {
    const data = {
      operationType: WSOperationTypeEnum.memorandum_append,
      params: {
        content: result,
      },
    };
    onSendMessage(JSON.stringify(data));
    content.value = "";
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
};
// 初始加载获取消息列表
const messageList = ref<Array<IMemorandum>>([]);
const getMessageList = () => {
  requestWrapper(
    async () => {
      const res = await service.memorandum.listMemorandum();
      if (res.data) {
        messageList.value = res.data;
      }
      memorandumContentScrollBottom();
      onConnectWebSocket();
    },
    true,
    true,
    () => {
      linkStatusHandler(LinkStatusEnum.failure);
    }
  );
};

onMounted(() => {
  getMessageList();
});
// 删除消息
const deleteMessage = (content: IMemorandum) => {
  const { id, userId } = content;
  if (id && userId) {
    requestWrapper(async () => {
      await service.memorandum.deleteMemorandumById(id);
      ElMessage.success("删除成功");
    });
  }
};
</script>
<template>
  <div class="memorandum-container">
    <main ref="memorandumListRef" class="memorandum-main">
      <div class="content-box" v-for="item in messageList" :key="item.id">
        <div v-html="getMessageHTML(item.content)"></div>
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
      </div>
    </main>
    <footer class="memorandum-footer">
      <el-input
        ref="inputRef"
        placeholder="链接格式：[文本](链接地址)&#13;&#10;CTRL+ENTER发送消息"
        :disabled="disabledSend"
        v-model="content"
        :rows="3"
        type="textarea"
        maxlength="2000"
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
</template>
<style lang="scss" scoped>
.memorandum-container {
  display: flex;
  height: 100%;
  flex-direction: column;
  .memorandum-main {
    flex: 1;
    overflow-y: auto;
    padding: 1em;
    width: 100%;
    max-width: 640px;
    margin: auto;
    .content-box {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      line-height: 1.5em;
      padding: 1em 1.5em;
      background-color: #f5f5f5;
      border-radius: 1em;
      white-space: pre-wrap;
      margin-top: 12px;
      &:first-child {
        margin-top: 0;
      }
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
    width: 100%;
    max-width: 640px;
    margin: auto;
    display: flex;
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
      margin-left: 4px;
      .el-button {
        border: none;
        margin-left: 0;
        border-radius: 0;
        height: 100%;
      }
    }
  }
}
</style>
