<script lang="ts" setup>
import { FormInstance, FormRules } from "element-plus";
import service, { ILoginForm } from "@/api/services";
import router from "../router";
import { useRoute } from "vue-router";
import { requestWrapper } from "@/api/request/index";
import useUserStore from "@/store/user";
import { storeToRefs } from "pinia";
const { user } = storeToRefs(useUserStore());

const route = useRoute();

const redirect = route.query.redirect;

const loginFormRef = ref<FormInstance>();
const loginRules = reactive<FormRules>({
  account: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
});
const loginForm = reactive<ILoginForm>({
  account: "",
  password: "",
});
const login = () => {
  loginFormRef.value?.validate((valid) => {
    if (valid) {
      requestWrapper(async () => {
        const { data: response } = await service.login.login(loginForm);
        user.value = response.data;
        router.push({ path: redirect ? (redirect as string) : "/" });
      });
    }
  });
};
</script>
<template>
  <div
    class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-black border-opacity-30 rounded-xl p-6"
  >
    <el-form
      :model="loginForm"
      :rules="loginRules"
      ref="loginFormRef"
      label-position="top"
      class="w-[360px] max-w-[80vw]"
    >
      <el-form-item label="账号" prop="account">
        <el-input maxlength="20" v-model="loginForm.account" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input
          type="password"
          maxlength="20"
          v-model="loginForm.password"
          @keydown.enter="login()"
        />
      </el-form-item>
      <div class="text-right">
        <el-button @click="login()">登录</el-button>
      </div>
    </el-form>
  </div>
</template>
