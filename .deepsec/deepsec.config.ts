import { defineConfig } from "deepsec/config";

export default defineConfig({
  projects: [
    { id: "jde-client", root: ".." },
    // <deepsec:projects-insert-above>
  ],
});
