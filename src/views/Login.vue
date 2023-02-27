<script lang="ts" setup>
import { FormInstance, FormRules } from "element-plus";
import { reactive, ref } from "vue";
import { ILoginForm, loginRequest } from "../api/services";
import router from "../router";
const loginFormRef = ref<FormInstance>();
const loginRules = reactive<FormRules>({
  systemPassword: [
    { required: true, message: "请输入系统密码", trigger: "blur" },
  ],
  username: [{ required: true, message: "请输入用户名称", trigger: "blur" }],
  password: [{ required: true, message: "请输入用户密码", trigger: "blur" }],
});
const loginForm = reactive<ILoginForm>({
  systemPassword: "",
  username: "",
  password: "",
});
const login = () => {
  loginFormRef.value?.validate((valid) => {
    if (valid) {
      loginRequest(loginForm).then(() => {
        router.replace({ path: "/" })
      }).catch(() =>{});
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
      <el-form-item label="系统密码" prop="systemPassword">
        <el-input type="password" maxlength="20" v-model="loginForm.systemPassword" />
      </el-form-item>
      <el-form-item label="账号" prop="username">
        <el-input maxlength="20" v-model="loginForm.username" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input type="password" maxlength="20" v-model="loginForm.password" @keydown.enter="login()" />
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
