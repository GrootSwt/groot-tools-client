<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import service, {
  ReadStatusEnum,
  IFriend,
  IFriendWithUnreadMsgCount,
  IMessage,
} from "@/api/services";
import { requestWrapper } from "@/api/request";
import { getCookie, scrollToBottom, toLoginPage } from "@/assets/tools";
import env from "@/assets/env";
import {
  ChatOperationTypeEnum,
  LinkStatusEnum,
  IMessageReadData,
  ISendMessageData,
  IWSResponse,
} from "@/api/model";

const friendList = ref<IFriendWithUnreadMsgCount[]>([]);
async function listFriendWithUnreadMsgCount() {
  return await service.friend.listFriendWithUnreadMsgCount();
}

const currentFriend = ref<IFriendWithUnreadMsgCount>();
const currentFriendMessageList = ref<IMessage[]>([]);
const messageListLoading = ref<boolean>(false);
async function listMessageByFriendId(friendId: string) {
  return await service.message.listMessageByFriendId(friendId);
}

function onChangeCurrentFriend(friend: IFriend) {
  if (friend.id === currentFriend.value?.id) return;
  requestWrapper(async () => {
    currentFriend.value = friend;
    currentFriendMessageList.value = [];
    messageListLoading.value = true;
    const res = await listMessageByFriendId(currentFriend.value.friendId);
    currentFriendMessageList.value = res.data;
  }, false).finally(() => {
    messageListLoading.value = false;
  });
}

onMounted(() => {
  requestWrapper(async () => {
    const res = await listFriendWithUnreadMsgCount();
    friendList.value = res.data;
    if (friendList.value.length > 0) {
      currentFriend.value = friendList.value[0];
      messageListLoading.value = true;
      const res2 = await listMessageByFriendId(currentFriend.value.friendId);
      currentFriendMessageList.value = res2.data;
      onMessageBoxScrollToBottom();
      connectWebSocket();
    }
  }).finally(() => {
    messageListLoading.value = false;
  });
});

onUnmounted(() => {
  clearTimeout(sendTimeoutTimer.value);
  clearInterval(heartbeatTimer.value);
});

const ws = ref<WebSocket>();
// 发送超时timer
const sendTimeoutTimer = ref<number>();
// 心跳检查timer
const heartbeatTimer = ref<number>();
// 发送消息禁用状态
const disabledSend = ref<boolean>(true);
// 连接状态
const linkStatus = ref<LinkStatusEnum>(LinkStatusEnum.loading);
// 连接消息
const linkMessage = ref<string>("服务器连接中");

const messageBoxRef = ref<HTMLElement>();

function onMessageBoxScrollToBottom() {
  nextTick(() => {
    messageBoxRef.value && scrollToBottom(messageBoxRef.value);
  });
}

function handleSendTimeout() {
  sendTimeoutTimer.value = setTimeout(() => {
    handleLinkStatus(LinkStatusEnum.failure);
  }, 5000);
}

// 心跳检查 30s一次
function heartbeatCheck() {
  heartbeatTimer.value = setInterval(() => {
    try {
      ws.value?.send(ChatOperationTypeEnum.heartbeat);
      handleSendTimeout();
    } catch (error) {
      handleLinkStatus(LinkStatusEnum.failure);
    }
  }, 30000);
}
function onMessageReadHandler(response: IWSResponse<IMessageReadData>) {
  const messageReadData = response.data;
  const senderId = messageReadData.senderId;
  const receiverId = messageReadData.receiverId;
  const userId = getCookie("userId");
  if (userId === senderId) {
    const unreadMessageCount = messageReadData.messageList.filter(
      (message) =>
        message.senderId === receiverId &&
        message.receiverId === userId &&
        message.readStatus === ReadStatusEnum.unread
    ).length;
    friendList.value.map((friend) => {
      if (friend.friendId === receiverId) {
        friend.unreadMessageCount = unreadMessageCount;
      }
    });
  } else if (userId === receiverId) {
    const unreadMessageCount = messageReadData.messageList.filter(
      (message) =>
        message.senderId === senderId &&
        message.receiverId === userId &&
        message.readStatus === ReadStatusEnum.unread
    ).length;
    friendList.value.map((friend) => {
      if (friend.friendId === senderId) {
        friend.unreadMessageCount = unreadMessageCount;
      }
    });
  }
  if (
    currentFriend.value?.friendId === senderId ||
    currentFriend.value?.friendId === receiverId
  ) {
    currentFriendMessageList.value = messageReadData.messageList;
  }
}

function onSendMessageHandler(response: IWSResponse<ISendMessageData>) {
  const messageReadData = response.data;
  const senderId = messageReadData.senderId;
  const receiverId = messageReadData.receiverId;
  const userId = getCookie("userId");
  if (userId === senderId) {
    const unreadMessageCount = messageReadData.messageList.filter(
      (message) =>
        message.senderId === receiverId &&
        message.receiverId === userId &&
        message.readStatus === ReadStatusEnum.unread
    ).length;
    friendList.value.map((friend) => {
      if (friend.friendId === receiverId) {
        friend.unreadMessageCount = unreadMessageCount;
      }
    });
  } else if (userId === receiverId) {
    const unreadMessageCount = messageReadData.messageList.filter(
      (message) =>
        message.senderId === senderId &&
        message.receiverId === userId &&
        message.readStatus === ReadStatusEnum.unread
    ).length;
    friendList.value.map((friend) => {
      if (friend.friendId === senderId) {
        friend.unreadMessageCount = unreadMessageCount;
      }
    });
  }
  if (
    currentFriend.value?.friendId === senderId ||
    currentFriend.value?.friendId === receiverId
  ) {
    currentFriendMessageList.value = messageReadData.messageList;
  }

  onMessageBoxScrollToBottom();
}
// 接收消息
function onMessage(e: MessageEvent) {
  clearTimeout(sendTimeoutTimer.value);
  if (e.data) {
    if (e.data === ChatOperationTypeEnum.heartbeat) {
      return;
    }
    if (JSON.parse(e.data).status !== 200) {
      return handleLinkStatus(
        LinkStatusEnum.failure,
        JSON.parse(e.data).status
      );
    }
    // 消息已读处理
    // 好友已读我发出的消息
    // 我已读好友发送的消息
    if (JSON.parse(e.data).operationType === ChatOperationTypeEnum.read) {
      const response = JSON.parse(e.data) as IWSResponse<IMessageReadData>;
      onMessageReadHandler(response);
    }
    // 发送消息
    if (JSON.parse(e.data).operationType === ChatOperationTypeEnum.send) {
      const response = JSON.parse(e.data) as IWSResponse<ISendMessageData>;
      onSendMessageHandler(response);
    }
  }
}

// WebSocket连接成功
function onWSOpen() {
  handleLinkStatus(LinkStatusEnum.success);
  clearTimeout(sendTimeoutTimer.value);
  if (ws.value) {
    ws.value.onmessage = onMessage;
    ws.value.onclose = () => handleLinkStatus(LinkStatusEnum.failure);
  }
}
function connectWebSocket() {
  const token = getCookie("token");
  ws.value = new WebSocket(env.WS_URL + "/chat", token);
  handleSendTimeout();
  ws.value.onopen = onWSOpen;
  ws.value.onerror = () => handleLinkStatus(LinkStatusEnum.failure);
}
function handleLinkStatus(status: LinkStatusEnum, code?: number) {
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
      break;
    default:
      break;
  }
  if (code === 401) {
    toLoginPage();
  }
}

function readAllMessage() {
  if (
    currentFriendMessageList.value.filter((message) => {
      return (
        message.senderId === currentFriend.value?.friendId &&
        message.receiverId === currentFriend.value?.userId &&
        message.readStatus === ReadStatusEnum.unread
      );
    }).length === 0
  )
    return;
  const request = {
    operationType: ChatOperationTypeEnum.read,
    params: {
      senderId: currentFriend.value?.friendId,
      receiverId: currentFriend.value?.userId,
    },
  };
  ws.value?.send(JSON.stringify(request));
}

const messageBody = ref<string>();
function sendMessage() {
  if (messageBody.value?.trim()) {
    const message = messageBody.value.trim();
    ws.value?.send(
      JSON.stringify({
        operationType: ChatOperationTypeEnum.send,
        params: {
          senderId: currentFriend.value?.userId,
          receiverId: currentFriend.value?.friendId,
          message,
        },
      })
    );
    messageBody.value = "";
  }
}
</script>
<template>
  <main
    class="flex flex-col justify-center items-center h-full text-slate-100 text-base"
  >
    <h3
      class="p-2 text-gray-90 rounded-lg"
      :class="{
        'bg-yellow-500': linkStatus === LinkStatusEnum.loading,
        'bg-lime-500': linkStatus === LinkStatusEnum.success,
        'bg-red-500': linkStatus === LinkStatusEnum.failure,
      }"
    >
      {{ linkMessage }}
    </h3>
    <section
      class="mt-3 flex justify-center items-center h-4/5 w-4/5 max-w-5xl p-6 rounded-3xl bg-slate-500 shadow-xl shadow-black/50"
    >
      <article
        class="flex flex-col gap-3 w-1/4 h-full rounded-3xl bg-slate-700 shadow-xl shadow-black/50 py-6 overflow-y-auto"
      >
        <!-- friend list -->
        <div
          v-for="friend of friendList"
          :key="friend.id"
          class="relative"
          @click="onChangeCurrentFriend(friend)"
        >
          <article
            class="text-center text-ellipsis overflow-hidden rounded-xl whitespace-nowrap cursor-pointer mx-6 px-3 py-1.5 mt-3"
            :class="{
              'bg-teal-600': currentFriend?.id !== friend.id,
              'bg-pink-600': currentFriend?.id === friend.id,
            }"
          >
            {{ friend.commentName || friend.displayName || friend.account }}
          </article>
          <span
            v-if="friend.unreadMessageCount"
            class="absolute top-0 right-3 bg-red-800 w-6 text-center rounded-full"
          >
            {{ friend.unreadMessageCount }}
          </span>
        </div>
      </article>
      <article
        class="flex flex-col flex-1 ml-6 w-3/5 h-full rounded-3xl p-6 bg-slate-700 shadow-xl shadow-black/50"
        :class="{ 'custom-loading': messageListLoading }"
        @click="readAllMessage"
      >
        <section
          ref="messageBoxRef"
          class="flex flex-col gap-3 flex-1 overflow-y-auto"
        >
          <article
            v-for="message of currentFriendMessageList"
            :key="message.id"
            class="inline-flex flex-col w-max"
            :class="{
              'self-end': message.senderId !== currentFriend?.friendId,
            }"
          >
            <p
              class="p-2 text-neutral-900 w-max rounded-lg"
              :class="{
                'bg-lime-200': message.senderId === currentFriend?.friendId,
                'bg-emerald-200': message.senderId !== currentFriend?.friendId,
              }"
            >
              {{ message.content }}
            </p>
            <span
              class="text-sm text-right mt-1"
              :class="{
                'text-lime-200': message.senderId === currentFriend?.friendId,
                'text-emerald-200':
                  message.senderId !== currentFriend?.friendId,
                'text-red-200': message.readStatus === ReadStatusEnum.unread,
              }"
            >
              {{ message.readStatus === ReadStatusEnum.read ? "已读" : "未读" }}
            </span>
          </article>
        </section>
        <section class="flex flex-none justify-center items-center mt-6">
          <el-input type="textarea" v-model="messageBody"></el-input>
          <el-button class="ml-3 h-full" @click="sendMessage">发送</el-button>
        </section>
      </article>
    </section>
  </main>
</template>
<style lang="scss" scoped></style>
