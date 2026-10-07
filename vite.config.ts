/**
 * Vite Configuration for Smarter Chat
 *
 * Smarter Chat is built two ways:
 *
 * - `npm run build` (the default, as for every app in the Smarter React workspace): builds the React app
 *   that the Django LLMClient prompt workbench hosts. Inside the workspace, output is written to the
 *   Django static directory, with a manifest.json that Django's templatetag
 *   (smarter.apps.prompt.templatetags.react_smarter_chat) reads to resolve the hashed asset filenames.
 *   In a plain clone of this repository, which has no Django static directory, it is written to build/.
 * - `npm run build:lib` (`vite build --mode lib`): builds the @smarter.sh/ui-chat library that is
 *   published to npm, for bespoke web pages that use Smarter as their chat backend. Output is written
 *   to dist/: ES and UMD bundles, and ui-chat.css. React is a peer dependency, and is not bundled.
 *
 * In development, `npm run dev` serves index.html, and proxies api and static requests to the Django
 * development server.
 */
import { defineConfig, type ConfigEnv, type PluginOption, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import packageJson from "./package.json" with { type: "json" };

const packageName = packageJson.name;

// Inside the Smarter repository, smarter/react/packages/smarter-chat, the app is built into Django's
// static directory. A plain clone of this repository builds it into build/ instead.
const djangoStaticRoot = path.resolve(import.meta.dirname, "../../../smarter/static");
const djangoStaticDir = fs.existsSync(djangoStaticRoot)
  ? path.join(djangoStaticRoot, "react", packageName)
  : path.resolve(import.meta.dirname, "build");

/**
 * Vite Plugin: addCustomManifestData
 *
 * Injects build metadata into the generated manifest.json: the build time, the package version and
 * the build environment. Django displays these for debugging purposes.
 */
const addCustomManifestData: PluginOption = {
  name: "add-custom-manifest-data",
  writeBundle() {
    const manifestPath = path.join(djangoStaticDir, "manifest.json");
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      manifest._custom = {
        buildTime: new Date().toISOString(),
        version: packageJson.version,
        buildEnv: process.env.NODE_ENV || "development",
      };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }
  },
};

// Vite 8 minifies with the Oxc minifier. Mark console.debug() calls as side-effect-free so that
// dead-code elimination strips them from production builds (avoids leaking sensitive info).
const minify = {
  compress: {
    treeshake: {
      manualPureFunctions: ["console.debug"],
    },
  },
};

const resolve = {
  alias: {
    "@": path.resolve(import.meta.dirname, "./src"),
  },
};

/** The npm library: @smarter.sh/ui-chat. */
function libraryConfig(): UserConfig {
  return {
    plugins: [react()],
    resolve,
    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: true,
      lib: {
        entry: path.resolve(import.meta.dirname, "src/index.ts"),
        name: "SmarterChatLibrary",
        formats: ["es", "umd"],
        fileName: (format) => `smarter-chat-library.${format}.js`,
        // consumers import "@smarter.sh/ui-chat/dist/ui-chat.css", as they have since v0.1.
        cssFileName: "ui-chat",
      },
      rolldownOptions: {
        external: ["react", "react-dom", "react/jsx-runtime"],
        output: {
          globals: {
            react: "React",
            "react-dom": "ReactDOM",
            "react/jsx-runtime": "jsxRuntime",
          },
          minify,
        },
      },
    },
  };
}

/** The React app that Django's LLMClient prompt workbench hosts. */
function appConfig(command: ConfigEnv["command"]): UserConfig {
  return {
    plugins: [react(), addCustomManifestData],
    // Vite's dev server serves from '/'. Builds are served by Django from its static directory.
    base: command === "serve" ? "/" : `/static/react/${packageName}/`,
    resolve,
    build: {
      // The manifest is used by Django's templatetag to find the hashed file names to include in
      // the HTML template.
      manifest: "manifest.json",
      // Built into the Django static directory, so that collectstatic includes these files.
      outDir: djangoStaticDir,
      emptyOutDir: true,
      rolldownOptions: {
        output: {
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
          // React and the chat's ui libraries change less often than this app, so the browser can
          // keep them cached when it changes.
          manualChunks(id: string) {
            return id.includes("node_modules") ? "vendor" : undefined;
          },
          minify,
        },
      },
    },
    // Django serves the web console's stylesheets and api. Requests for them, from index.html and
    // the app, are proxied to the Django development server.
    server: {
      proxy: {
        "/api": "http://localhost:9357",
        "/assets": {
          target: "http://localhost:9357",
          changeOrigin: true,
          rewrite: (path: string) => `/static${path}`,
        },
        "/common-styles.css": {
          target: "http://localhost:9357",
          changeOrigin: true,
          rewrite: (path: string) => `/static${path}`,
        },
        "/static": {
          target: "http://localhost:9357",
          changeOrigin: true,
        },
        "/workbench/": "http://localhost:9357",
      },
    },
  };
}

export default defineConfig(({ command, mode }: ConfigEnv) => (mode === "lib" ? libraryConfig() : appConfig(command)));
