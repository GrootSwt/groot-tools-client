<script lang="ts" setup>
import { IFriendWithUnreadMsgCount } from "@/api/services";
import useCommonStore from "@/store/common";
import { storeToRefs } from "pinia";

const props = defineProps<{
  visible: boolean;
  friendList: IFriendWithUnreadMsgCount[];
  currentFriend?: IFriendWithUnreadMsgCount;
}>();

const emit = defineEmits([
  "onChangeCurrentFriend",
  "onToggleShowFriendListVisible",
]);

function onChangeCurrentFriend(friend: IFriendWithUnreadMsgCount) {
  emit("onChangeCurrentFriend", friend);
}

const { isSP } = storeToRefs(useCommonStore());
const isShowFriendList = ref<boolean>(false);

watch(
  () => props.visible,
  (next) => {
    isShowFriendList.value = next;
  },
  {
    immediate: true,
  }
);
</script>
<template>
  <article
    v-if="isShowFriendList"
    class="flex flex-col gap-3 w-1/4 h-full rounded-3xl bg-slate-500 shadow-xl shadow-slate-600/50 py-6 overflow-y-auto"
    :class="{
      'fixed inset-0 rounded-none p-0 z-10 w-full': isSP,
    }"
  >
    <div
      v-for="friend of friendList"
      :key="friend.id"
      class="relative"
      @click="onChangeCurrentFriend(friend)"
    >
      <article
        class="text-center text-ellipsis overflow-hidden rounded-xl whitespace-nowrap cursor-pointer mx-6 px-3 py-1.5 mt-3 bg-green-800"
        :class="{
          '!bg-green-600 cursor-not-allowed': currentFriend?.id === friend.id,
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
</template>
<style lang="scss" scoped></style>
