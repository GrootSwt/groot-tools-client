<script lang="ts" setup>
import service, { IMemorandum, MemorandumType } from "../api/services";
import { scrollToBottom } from "../assets/tools";
import { compressImage, copyToClipboard } from "../assets/tools/common";
import { ElMessage, ElMessageBox, InputInstance } from "element-plus";
import { requestWrapper } from "@/api/request/index";
import {
  IResponseData,
  IWSResponse,
  LinkStatusEnum,
  WSOperationTypeEnum,
} from "@/api/model";
import { useWebSocket } from "@/assets/hooks";
import ButtonView from "@/components/ButtonView.vue";

const needReConnect = ref(true);

const { onConnectWebSocket, onSendMessage, linkStatusHandler } = useWebSocket(
  "/memorandum",
  onWSMessage,
  needReConnect,
  () => {
    disabledSend.value = false;
  },
  () => {
    disabledSend.value = true;
  },
  fetchMemorandumList
);
// 是否禁止发送消息
const disabledSend = ref(true);
const content = ref<string>("");
const memorandumListRef = ref<HTMLDivElement>();
const inputRef = ref<
  InputInstance & { ref: HTMLInputElement | HTMLTextAreaElement | undefined }
>();

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
  const linkRule = /\[.+\]\(http(s)?:\/\/.+/g;
  const links = value.match(linkRule);
  if (links) {
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const splitIndex = link.indexOf("](");
      const title = link.substring(1, splitIndex);
      const href = link.substring(splitIndex + 2, link.length - 1);
      const replaceLink = `<a href="${href}" class="text-blue-400 underline" target="blank">${title}</a>`;
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
// 添加链接模版
const addLinkTemplate = () => {
  const template = "[]()";
  if (content.value.length < 2000 - template.length) {
    content.value += template;
    nextTick(() => {
      const selectionStart = content.value.length - (template.length - 1);
      console.log(inputRef.value?.input);
      inputRef.value?.ref?.focus();
      inputRef.value?.ref?.setSelectionRange(selectionStart, selectionStart);
    });
  }
};
// 初始加载获取消息列表
const messageList = ref<Array<IMemorandum>>([]);
// 获取消息列表
async function fetchMemorandumList(signal?: AbortSignal) {
  const {
    data: { data },
  } = await service.memorandum.listMemorandum({
    signal,
  });
  if (data) {
    messageList.value = data;
  }
}
function getMessageList() {
  requestWrapper(
    async ({ abortController }) => {
      await fetchMemorandumList(abortController.signal);
      memorandumContentScrollBottom();
      onConnectWebSocket();
    },
    {
      enabledFullScreenLoading: true,
      errorHandler: () => {
        linkStatusHandler(LinkStatusEnum.failure);
        return false;
      },
    }
  );
}

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
const fileUploaderRef = shallowRef<HTMLInputElement | null>(null);
let chooseFile: File | null = null;

function openFileUploader() {
  const fileUploader = fileUploaderRef.value;
  if (fileUploader) {
    fileUploader.value = "";
    fileUploader.click();
  }
}
const fileAccept = ref(".pdf,.doc,.docx,.xls,.jpg,.jpeg,.png");

// 单位B
const MAX_SIZE = 100 * 1024;

async function onFileUploaderChange() {
  const fileUploader = fileUploaderRef.value;
  if (fileUploader && fileUploader.files) {
    let file = fileUploader.files[0];
    const { size, name, type } = file;
    const fileAcceptList = fileAccept.value.split(",");
    if (fileAcceptList.indexOf(name.substring(name.lastIndexOf("."))) === -1) {
      ElMessage.warning("仅支持以下文件类型：" + fileAccept.value);
    }
    if (size > MAX_SIZE) {
      if (type.startsWith("image")) {
        const messageHandler = ElMessage.info("尝试压缩图片");
        try {
          file = await compressImage(file, MAX_SIZE / 1024);
          ElMessage.success("图片压缩成功");
        } catch (error) {
          messageHandler.close();
          ElMessage.error("图片压缩失败，请选择小于100KB的文件");
          return;
        }
      } else {
        ElMessage.warning("上传文件大于100KB");
        return;
      }
    }
    chooseFile = file;
    popupMessageBox();
    return;
  }
}
function popupMessageBox() {
  ElMessageBox.confirm("是否上传文件?(上传的文件2～4天后自动删除)", "", {
    confirmButtonText: "上传",
    cancelButtonText: "取消",
  }).then(() => {
    uploadFile();
  });
}

function uploadFile() {
  if (chooseFile) {
    const formData = new FormData();
    formData.append("file", chooseFile);
    requestWrapper(async () => {
      await service.memorandum.uploadFile(formData);
    });
  }
}

function downloadFile(content: IMemorandum) {
  const { file } = content;
  if (file?.id && file.originalName) {
    requestWrapper(async () => {
      await service.file.download(file.id, file.originalName);
    });
  }
}
</script>
<template>
  <div class="flex flex-col h-full">
    <main
      ref="memorandumListRef"
      class="flex-1 overflow-y-auto p-4 w-full max-w-[640px] m-auto flex flex-col gap-3"
    >
      <div
        class="flex items-start justify-between leading-normal px-4 py-6 bg-gray-100 rounded-2xl whitespace-pre-wrap"
        v-for="item in messageList"
        :key="item.id"
      >
        <div
          v-if="item.contentType === MemorandumType.TEXT"
          v-html="getMessageHTML(item.content)"
        ></div>
        <div v-else-if="item.contentType === MemorandumType.FILE">
          <span class="cursor-pointer text-green-400">
            {{ item.file?.originalName }}
          </span>
        </div>
        <div class="flex-none">
          <el-button
            v-if="item.contentType === MemorandumType.TEXT"
            size="small"
            circle
            @click="copyToClipboard(item.content)"
          >
            <el-icon>
              <i-ep-copy-document />
            </el-icon>
          </el-button>
          <el-button
            v-else-if="item.contentType === MemorandumType.FILE"
            class="ml-4"
            size="small"
            circle
            @click="downloadFile(item)"
          >
            <el-icon>
              <i-ep-download />
            </el-icon>
          </el-button>
          <el-button
            class="ml-4"
            size="small"
            circle
            @click="deleteMessage(item)"
          >
            <el-icon>
              <i-ep-delete />
            </el-icon>
          </el-button>
        </div>
      </div>
    </main>
    <footer
      class="flex-none w-full max-w-[640px] mx-auto flex flex-col gap-1 bg-slate-200 rounded-md p-1"
    >
      <section class="flex items-center gap-1 px-2">
        <el-icon @click="addLinkTemplate" class="cursor-pointer">
          <i-ep-link />
        </el-icon>
        <el-icon class="cursor-pointer" @click="openFileUploader">
          <i-ep-upload />
          <input
            ref="fileUploaderRef"
            type="file"
            class="hidden"
            :accept="fileAccept"
            @change="onFileUploaderChange"
          />
        </el-icon>
      </section>
      <section class="flex">
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
        <div class="ml-1">
          <ButtonView
            :disabled="disabledSend"
            class="bg-gray-500 text-white h-full disabled:text-gray-300"
            @click="sendMessage()"
          >
            发送
          </ButtonView>
        </div>
      </section>
    </footer>
  </div>
</template>
