<script lang="ts" setup>
import {
  compressImage,
  ImageFileInfo,
  getImageFileInfo,
  downloadFile,
  validateNumeric,
} from "../assets/tools";
import {
  genFileId,
  UploadFile,
  UploadInstance,
  UploadProps,
  UploadRawFile,
} from "element-plus";
import ButtonView from "@/components/ButtonView.vue";

const uploadRef = ref<UploadInstance>();
const originFile = ref<UploadFile>();
const originImageFileInfo = ref<ImageFileInfo>();
watch(
  () => originFile.value,
  (next) => {
    if (next?.raw) {
      getImageFileInfo(next.raw as File).then((imageFileInfo) => {
        originImageFileInfo.value = imageFileInfo;
      });
    } else {
      originImageFileInfo.value = undefined;
    }
  }
);
const handleExceed: UploadProps["onExceed"] = (files) => {
  uploadRef.value?.clearFiles();
  const file = files[0] as UploadRawFile;
  file.uid = genFileId();
  uploadRef.value?.handleStart(file);
  compressedFileParams.value = { ...initParams };
};
const handleChange: UploadProps["onChange"] = (file) => {
  originFile.value = file;
};
const handleRemove: UploadProps["onRemove"] = () => {
  originFile.value = undefined;
  compressedFile.value = undefined;
  compressedFileParams.value = { ...initParams };
};

const initParams = {
  maxSize: 256,
  maxWidth: 520,
  maxHeight: 520,
};
const compressedFileParams = ref<{
  maxSize: number;
  maxWidth: number;
  maxHeight: number;
}>({ ...initParams });
const compressLoading = ref<boolean>(false);
const compressedFile = ref<File>();
const compressedFileUrl = computed(() => {
  if (compressedFile.value) {
    return URL.createObjectURL(compressedFile.value);
  }
  return "";
});
const compressedImageFileInfo = ref<ImageFileInfo>();
watch(
  () => compressedFile.value,
  (next) => {
    if (next) {
      getImageFileInfo(next).then((imageFileInfo) => {
        compressedImageFileInfo.value = imageFileInfo;
      });
    } else {
      compressedImageFileInfo.value = undefined;
    }
  }
);

const compress = async () => {
  compressLoading.value = true;
  const result = await compressImage(
    originFile.value?.raw as File,
    compressedFileParams.value.maxSize,
    undefined,
    compressedFileParams.value.maxWidth,
    compressedFileParams.value.maxHeight
  ).finally(() => {
    compressLoading.value = false;
  });
  compressedFile.value = result;
};

const downloadCompressedFile = () => {
  compressedFile.value && downloadFile(compressedFile.value);
};
</script>
<template>
  <section class="m-w-[1200px] mx-auto p-6">
    <el-upload
      class="m-auto m-w-[520px]"
      ref="uploadRef"
      drag
      accept="image/png, image/jpeg"
      :limit="1"
      :auto-upload="false"
      :on-exceed="handleExceed"
      :on-change="handleChange"
      :on-remove="handleRemove"
    >
      <el-icon class="el-icon--upload"><i-ep-upload-filled /></el-icon>
      <div class="el-upload__text">拖拽或者<em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip font-bold">
          支持图片格式：<code>image/png, image/jpeg</code>
        </div>
        <div class="el-upload__tip font-bold">仅支持上传一张图片</div>
      </template>
    </el-upload>
    <section class="" v-if="originImageFileInfo">
      <h3 class="mt-6">原图片文件信息：</h3>
      <article class="flex flex-wrap gap-3 mt-6">
        <h5 class="flex-none bg-slate-100 px-1 py-2">
          大小: {{ originImageFileInfo.size }}
        </h5>
        <h5 class="flex-none bg-slate-100 px-1 py-2">
          宽度: {{ originImageFileInfo.width }}
        </h5>
        <h5 class="flex-none bg-slate-100 px-1 py-2">
          高度: {{ originImageFileInfo.height }}
        </h5>
      </article>
    </section>
    <section class="mt-6" v-if="originImageFileInfo">
      <h3>压缩后图片参数设置：</h3>
      <article class="flex flex-wrap gap-3 mt-6">
        <el-input
          class="flex-none !w-[220px]"
          v-model="compressedFileParams.maxSize"
          @input="validateNumeric(compressedFileParams, 'maxSize')"
          placeholder="max size"
        >
          <template #prepend>最大体积</template>
          <template #append>KB</template>
        </el-input>
        <el-input
          class="flex-none !w-[220px]"
          v-model="compressedFileParams.maxWidth"
          @input="validateNumeric(compressedFileParams, 'maxWidth')"
          placeholder="max width"
        >
          <template #prepend>最大宽度</template>
          <template #append>px</template>
        </el-input>
        <el-input
          class="flex-none !w-[220px]"
          v-model="compressedFileParams.maxHeight"
          @input="validateNumeric(compressedFileParams, 'maxHeight')"
          placeholder="max height"
        >
          <template #prepend>最大高度</template>
          <template #append>px</template>
        </el-input>
      </article>
      <ButtonView class="mt-6" @click="compress" :loading="compressLoading">
        {{ compressLoading ? "压缩中" : "压缩" }}
      </ButtonView>
    </section>
    <section class="compressed-image-info" v-if="compressedImageFileInfo">
      <h3 class="mt-6">压缩后的图片信息：</h3>
      <article class="flex flex-wrap gap-3 mt-6">
        <h5 class="flex-none info-item">
          大小：{{ compressedImageFileInfo.size }}
        </h5>
        <h5 class="flex-none info-item">
          宽度：{{ compressedImageFileInfo.width }}
        </h5>
        <h5 class="flex-none info-item">
          高度：{{ compressedImageFileInfo.height }}
        </h5>
      </article>
      <article class="mt-6">
        <el-image
          :src="compressedFileUrl"
          :style="{ height: '100px' }"
          :preview-src-list="[compressedFileUrl]"
        ></el-image>
      </article>
      <ButtonView class="mt-6" @click="downloadCompressedFile">
        下载
      </ButtonView>
    </section>
  </section>
</template>
