import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { registerGlobalComponents } from "./components";
import { registerPermissionDirective } from "./directives/permission";

const app = createApp(App);
registerGlobalComponents(app);
registerPermissionDirective(app);
app.use(router).mount("#app");
