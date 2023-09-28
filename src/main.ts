import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";
import piniaPluginPersist from "pinia-plugin-persist";
import "./assets/styles/index.scss";

const pinia = createPinia();
pinia.use(piniaPluginPersist);
createApp(App).use(router).use(pinia).mount("#app");
