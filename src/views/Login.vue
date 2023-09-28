<script lang="ts" setup>
import { FormInstance, FormRules } from "element-plus";
import service, { ILoginForm } from "@/api/services";
import router from "../router";
import { useRoute } from "vue-router";
import { requestWrapper } from "@/api/request";
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
        const res = await service.login.login(loginForm);
        user.value = res.data;
        router.push({ path: redirect ? (redirect as string) : "/" });
      });
    }
  });
};
</script>
<template>
  <div class="login-container">
    <el-form
      :model="loginForm"
      :rules="loginRules"
      ref="loginFormRef"
      label-position="top"
      class="login-form"
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
      <div class="login-operation">
        <el-button @click="login()">登录</el-button>
      </div>
    </el-form>
  </div>
</template>
<style lang="scss" scoped>
.login-container {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border: 1px solid rgba($color: #000000, $alpha: 0.3);
  border-radius: 12px;
  padding: 24px;
  .login-form {
    width: 360px;
    max-width: calc(100vw - 120px);
  }
  .login-operation {
    text-align: right;
  }
}
</style>
