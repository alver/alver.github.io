import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// User Pages site served at the domain root (https://alver.cc), both locally
// and deployed — no BASE_PATH knob needed, unlike a project site under /<repo>/.
export default defineConfig({
  base: "/",
  plugins: [preact()],
});
