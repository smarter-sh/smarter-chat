import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";
import { comlink } from "vite-plugin-comlink";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const commonConfig = {
    plugins: [react(), comlink(), tsconfigPaths()],
    build: {
      sourcemap: true,
      outDir: "../dist",
      rollupOptions: {
        external: ["react", "react/jsx-runtime", "react-helmet", "react-modal"],
        output: {
          globals: {
            react: "React",
          },
        },
      },
    },
    root: "src",
  };

  if (mode === "dev") {
    return {
      ...commonConfig,
      base: "/",
      server: {
        port: 3000,
        open: true,
      },
    };
  } else if (mode === "lib") {
    return {
      ...commonConfig,
      build: {
        ...commonConfig.build,
        lib: {
          entry: resolve(__dirname, "src/index.js"),
          name: "SmarterChatLibrary",
          fileName: (format) => `smarter-chat-library.${format}.js`,
        },
      },
    };
  } else {
    return {
      ...commonConfig,
    };
  }
});
