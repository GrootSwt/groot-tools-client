<script setup lang="ts">
import service, {
  ReadStatusEnum,
  IFriend,
  IFriendWithUnreadMsgCount,
  IMessage,
} from "@/api/services";
import { requestWrapper } from "@/api/request";
import { scrollToBottom, formatDateTime } from "@/assets/tools";
import {
  WSOperationTypeEnum,
  IMessageReadData,
  ISendMessageData,
  IWSResponse,
  IWSResponseData,
  LinkStatusEnum,
} from "@/api/model";
import { dayjs } from "element-plus";
import useCommonStore from "@/store/common";
import { storeToRefs } from "pinia";
import FriendList from "./components/FriendList.vue";
import { useWebSocket } from "@/assets/hooks";
import ButtonView from "@/components/ButtonView.vue";

const needReConnect = ref(false);

const { onConnectWebSocket, onSendMessage, linkStatusHandler } = useWebSocket(
  "/chat",
  onWSReceiveMessage,
  needReConnect,
  () => {
    disabledSend.value = false;
  },
  () => {
    disabledSend.value = true;
  },
  fetchMessageList
);

const { isSP } = storeToRefs(useCommonStore());

const friendList = ref<IFriendWithUnreadMsgCount[]>([]);

const friendListLength = computed(() => {
  return friendList.value.length;
});

async function listFriendWithUnreadMsgCount() {
  return await service.friend.listFriendWithUnreadMsgCount();
}

const currentFriend = ref<IFriendWithUnreadMsgCount>();
const hasPrev = ref<boolean>(false);
const currentFriendMessageList = ref<IMessage[]>([]);

interface IMessageWithIsShowTime extends IMessage {
  isShowTime: boolean;
}
// 渲染的消息列表
const messageList = computed<IMessageWithIsShowTime[]>(() => {
  const result: IMessageWithIsShowTime[] = [];
  currentFriendMessageList.value.forEach((message) => {
    result.push({
      ...message,
      isShowTime: true,
    });
  });
  result.reduce(
    (
      previous: IMessageWithIsShowTime | null,
      current: IMessageWithIsShowTime
    ) => {
      if (!previous) {
        current.isShowTime = true;
      } else if (
        // 与上一条消息的时间差少于120秒（2分钟），不显示当前消息的时间
        dayjs(current.createTime).unix() - dayjs(previous.createTime).unix() <
        120
      ) {
        current.isShowTime = false;
      }

      return current;
    },
    null
  );
  return result;
});
// 未读的消息id列表
const unreadMessageIds = computed<string[]>(() => {
  return currentFriendMessageList.value
    .filter(
      (message) =>
        message.senderId === currentFriend.value?.friendId &&
        message.readStatus === ReadStatusEnum.unread
    )
    .map((message) => message.id);
});
const messageListLoading = ref<boolean>(false);
async function listMessageByFriendId(friendId: string) {
  return await service.message.listMessageByFriendId(friendId);
}
// 切换当前朋友和消息列表
function onChangeCurrentFriend(friend: IFriend) {
  if (friend.id === currentFriend.value?.id) {
    isSP.value && onToggleShowFriendListVisible();
    return;
  }
  requestWrapper(async () => {
    currentFriend.value = friend;
    currentFriendMessageList.value = [];
    messageListLoading.value = true;
    const { data: response } = await listMessageByFriendId(
      currentFriend.value.friendId
    );
    hasPrev.value = response.data.hasPrev;
    currentFriendMessageList.value = response.data.messageList;
    onMessageBoxScrollToBottom();
    isSP.value && onToggleShowFriendListVisible();
  }).finally(() => {
    messageListLoading.value = false;
  });
}

async function fetchMessageList() {
  if (currentFriend.value?.friendId) {
    const { data: response } = await listMessageByFriendId(
      currentFriend.value.friendId
    );
    hasPrev.value = response.data.hasPrev;
    currentFriendMessageList.value = response.data.messageList;
    onMessageBoxScrollToBottom();
  }
}

// 初始化
// 获取朋友列表和第一个朋友的消息列表
function init() {
  requestWrapper(
    async () => {
      const { data } = await listFriendWithUnreadMsgCount();
      friendList.value = data.data;
      if (friendList.value.length > 0) {
        needReConnect.value = true;
        currentFriend.value = friendList.value[0];
        messageListLoading.value = true;
        const { data: data2 } = await listMessageByFriendId(
          currentFriend.value.friendId
        );
        hasPrev.value = data2.data.hasPrev;
        currentFriendMessageList.value = data2.data.messageList;
        onMessageBoxScrollToBottom();
        onConnectWebSocket();
      }
    },
    {
      enabledFullScreenLoading: true,
      errorHandler: () => {
        linkStatusHandler(LinkStatusEnum.failure);
        return false;
      },
    }
  ).finally(() => {
    messageListLoading.value = false;
  });
}

// 发送消息禁用状态
const disabledSend = ref<boolean>(true);
// 消息列表
const messageListRef = ref<HTMLElement>();
// 获取以前的消息
const fetchPrevMessageLoading = ref(false);
async function fetchPrevMessageList() {
  const currentFriendId = currentFriend.value?.friendId;
  if (currentFriendId && currentFriendMessageList.value.length > 0) {
    const firstMessageId = currentFriendMessageList.value[0].id;
    fetchPrevMessageLoading.value = true;
    await requestWrapper(
      async () => {
        const { data: response } = await service.message.listMessageByFriendId(
          currentFriendId,
          firstMessageId
        );
        hasPrev.value = response.data.hasPrev;
        currentFriendMessageList.value = [
          ...response.data.messageList,
          ...currentFriendMessageList.value,
        ];
        fetchPrevMessageLoading.value = false;
      },
      {
        errorHandler: () => {
          fetchPrevMessageLoading.value = false;
          return false;
        },
      }
    );
  }
}

async function onMessageListScroll() {
  const messageListEl = messageListRef.value;
  if (!fetchPrevMessageLoading.value && hasPrev.value && !!messageListEl) {
    if (messageListEl.scrollTop === 0) {
      const prevScrollHeight = messageListEl.scrollHeight;
      await fetchPrevMessageList();
      nextTick(() => {
        const nextScrollHeight = messageListEl.scrollHeight;
        messageListEl.scrollTop = nextScrollHeight - prevScrollHeight;
      });
    }
  }
}

function onMessageBoxScrollToBottom() {
  nextTick(() => {
    messageListRef.value && scrollToBottom(messageListRef.value);
  });
}

// 消息已读ws接收消息处理器
function onMessageReadHandler(response: IWSResponse<IMessageReadData>) {
  const messageReadData = response.data;
  const { friendId, readMessageIds, unreadCount } = messageReadData;
  if (currentFriend.value?.friendId === friendId) {
    currentFriend.value.unreadMessageCount = unreadCount;
    currentFriendMessageList.value.forEach((message) => {
      if (
        readMessageIds.find((readMessageId) => readMessageId === message.id)
      ) {
        message.readStatus = ReadStatusEnum.read;
      }
    });
  } else {
    const senderFriend = friendList.value.find(
      (friend) => friend.friendId === friendId
    );
    if (senderFriend) {
      senderFriend.unreadMessageCount = unreadCount;
    }
  }
}
// 发送消息ws接收消息处理器
function onSendMessageHandler(response: IWSResponse<ISendMessageData>) {
  const messageReadData = response.data;
  const { friendId, message, unreadMessageCount } = messageReadData;
  if (currentFriend.value?.friendId === friendId) {
    currentFriendMessageList.value.push(message);
  }
  const friend = friendList.value.find((f) => f.friendId === friendId);
  if (friend) {
    friend.unreadMessageCount = unreadMessageCount;
  }

  onMessageBoxScrollToBottom();
}
// ws接收消息

function onWSReceiveMessage(response: IWSResponse<IWSResponseData>) {
  if (response.operationType === WSOperationTypeEnum.chat_read) {
    onMessageReadHandler(response as IWSResponse<IMessageReadData>);
  }
  // 发送消息
  if (response.operationType === WSOperationTypeEnum.chat_send) {
    onSendMessageHandler(response as IWSResponse<ISendMessageData>);
  }
}

// 已读所有接收到的消息
function readAllMessage() {
  if (unreadMessageIds.value.length === 0) return;
  const request = {
    operationType: WSOperationTypeEnum.chat_read,
    params: {
      friendId: currentFriend.value?.friendId,
      unreadMessageIds: unreadMessageIds.value,
    },
  };
  onSendMessage(JSON.stringify(request));
}
// 发送消息
const messageBody = ref<string>();
function sendMessage() {
  if (messageBody.value?.trim()) {
    const message = messageBody.value.trim();
    onSendMessage(
      JSON.stringify({
        operationType: WSOperationTypeEnum.chat_send,
        params: {
          friendId: currentFriend.value?.friendId,
          message,
        },
      })
    );
    messageBody.value = "";
  }
}

const showFriendListVisible = ref<boolean>(false);
function onToggleShowFriendListVisible(visible?: boolean) {
  if (typeof visible === "boolean") {
    showFriendListVisible.value = visible;
    return;
  }
  showFriendListVisible.value = !showFriendListVisible.value;
}

function onShowFriendList() {
  showFriendListVisible.value = true;
}

watch(
  () => isSP.value,
  (next) => {
    onToggleShowFriendListVisible(!next);
  },
  {
    immediate: true,
  }
);

onMounted(() => {
  init();
  messageListRef.value?.addEventListener("scroll", onMessageListScroll);
});

onBeforeUnmount(() => {
  messageListRef.value?.removeEventListener("scroll", onMessageListScroll);
});
</script>
<template>
  <main
    v-if="friendListLength === 0"
    class="flex justify-center mt-2 text-lg font-bold"
  >
    没有好友
  </main>
  <main
    v-else
    class="flex flex-col justify-center items-center h-full text-slate-100 text-base"
  >
    <!-- 响应式为sp的时候显示查看朋友列表按钮 -->
    <ButtonView
      circle
      plain
      class="fixed z-10 left-4 top-16 bg-green-300 !border-none !rounded-full aspect-square flex items-center justify-center"
      :class="{
        '!hidden': !isSP,
      }"
      @click="onShowFriendList"
    >
      <el-icon :size="16">
        <i-ep-operation />
      </el-icon>
    </ButtonView>
    <section
      class="mt-3 flex justify-center gap-6 items-center h-4/5 w-4/5 max-w-5xl p-6 rounded-3xl bg-slate-300 shadow-xl shadow-slate-400/50"
      :class="{
        '!block !mt-0 h-full w-full !p-0 max-w-full rounded-none': isSP,
      }"
    >
      <!-- friend list -->
      <FriendList
        :visible="showFriendListVisible"
        :friend-list="friendList"
        :current-friend="currentFriend"
        @on-change-current-friend="onChangeCurrentFriend"
      ></FriendList>
      <!-- 消息列表和textarea -->
      <article
        class="flex flex-col flex-1 gap-6 py-6 w-3/5 h-full rounded-3xl bg-slate-500 shadow-xl shadow-slate-600/50"
        :class="{
          'custom-loading': messageListLoading,
          '!gap-3 w-full !pt-0 !pb-3 rounded-none': isSP,
        }"
        @click="readAllMessage"
      >
        <section
          class="hidden justify-center h-0 transition-[height]"
          :class="{
            '!flex !h-6': fetchPrevMessageLoading,
          }"
        >
          <el-icon class="h-full animate-spin"><i-ep-loading /></el-icon>
        </section>
        <!-- message list -->
        <section
          ref="messageListRef"
          class="flex flex-col gap-3 flex-1 overflow-y-auto px-6"
          :class="{
            '!px-3': isSP,
          }"
        >
          <div
            class="flex flex-col"
            v-for="message of messageList"
            :key="message.id"
          >
            <p v-if="message.isShowTime" class="self-center text-sm">
              {{ formatDateTime(message.createTime) }}
            </p>
            <article
              class="inline-flex flex-col w-max"
              :class="{
                'self-end': message.senderId !== currentFriend?.friendId,
              }"
            >
              <!-- 消息内容 -->
              <p
                class="p-2 text-neutral-900 w-max rounded-lg"
                :class="{
                  'bg-lime-200': message.senderId === currentFriend?.friendId,
                  'bg-emerald-200':
                    message.senderId !== currentFriend?.friendId,
                }"
              >
                {{ message.content }}
              </p>
              <!-- 消息读取状态标签 -->
              <span
                class="text-sm text-right mt-1"
                :class="{
                  'text-lime-300': message.senderId === currentFriend?.friendId,
                  'text-emerald-300':
                    message.senderId !== currentFriend?.friendId,
                  '!text-red-300': message.readStatus === ReadStatusEnum.unread,
                }"
              >
                {{
                  message.readStatus === ReadStatusEnum.read ? "已读" : "未读"
                }}
              </span>
            </article>
          </div>
        </section>
        <!-- message textarea -->
        <section
          class="flex flex-none justify-center items-center px-6"
          :class="{
            '!px-3': isSP,
          }"
        >
          <el-input
            type="textarea"
            v-model="messageBody"
            :disabled="disabledSend"
            @keyup.ctrl.enter="sendMessage"
          ></el-input>
          <ButtonView
            class="ml-3 h-full !border-none bg-neutral-500 text-white disabled:text-neutral-300"
            @click="sendMessage"
          >
            发送
          </ButtonView>
        </section>
      </article>
    </section>
  </main>
</template>
