<script lang="ts" setup>
import { ElMessage, MessageHandler } from "element-plus";
import { copyToClipboard } from "@/assets/tools";
import ButtonView from "@/components/ButtonView.vue";

const jsValue = ref<string>();

watch(
  () => jsValue.value,
  (next) => {
    js_to_json(next);
  }
);
const jsonValue = ref<string>();

let messageHandler: MessageHandler;

function js_to_json(value?: string) {
  if (value) {
    try {
      // 去掉空格、换行符、制表符
      value = value.replaceAll(/\s/g, "");
      // 去掉多余的“,”
      value = value.replace(/(,)[}|\]]/g, (match, p1) => {
        return match.replace(p1, "");
      });
      // 属性名两侧添加双引号
      value = value.replace(/[{|[|,](\w+):/g, (match, p1) => {
        return match.replace(p1, `"${p1}"`);
      });
      // 去掉尾部“,”
      value = value.endsWith(",")
        ? value.substring(0, value.length - 1)
        : value;
      value = JSON.parse(value);
      value = JSON.stringify(value, undefined, 2);
      jsonValue.value = value;
    } catch (error) {
      console.error(error);
      messageHandler && messageHandler.close();
      messageHandler = ElMessage.error("JS对象结构不正确");
      jsonValue.value = "";
    }
  } else {
    jsonValue.value = "";
  }
}

function copy(copyType: "preserveFormat" | "compress") {
  if (copyType === "preserveFormat") {
    copyToClipboard(jsonValue.value);
  } else if (copyType === "compress") {
    copyToClipboard(jsonValue.value?.replaceAll(/\s/g, ""));
  }
}
</script>
<template>
  <section class="flex flex-col mx-4 gap-4 mt-4">
    <article class="flex-auto">
      <h5>JS对象：</h5>
      <el-input
        class="mt-4"
        v-model="jsValue"
        :autosize="{ minRows: 10, maxRows: 20 }"
        type="textarea"
        placeholder="JS"
      />
    </article>
    <article class="flex-auto">
      <div class="flex justify-between items-center">
        <h5>JSON对象：</h5>
        <div v-if="!!jsonValue">
          <ButtonView @click="copy('preserveFormat')">格式复制</ButtonView>
          <ButtonView @click="copy('compress')" class="ml-2">
            压缩复制
          </ButtonView>
        </div>
      </div>
      <el-input
        class="mt-4"
        v-model="jsonValue"
        :autosize="{ minRows: 10, maxRows: 20 }"
        type="textarea"
        placeholder="JSON"
        readonly
      />
    </article>
  </section>
</template>
