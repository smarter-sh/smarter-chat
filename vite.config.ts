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
 * - `npm run build:embed` (`vite build --mode embed`, then `--mode embed-mermaid`): builds the embed script,
 *   dist/embed.js, for web pages that aren't built with React, e.g. WordPress, Drupal and Shopify sites, Google Tag
 *   Manager and documentation sites. It is one classic script, with React and its css included, that renders the
 *   chat in a shadow root. Mermaid is a separate ES module build in dist/embed/mermaid/, which embed.js imports only
 *   when a message has a diagram, and KaTeX's fonts are copied to dist/embed/katex/fonts/. See src/embed/index.ts.
 *
 * In development, `npm run dev` serves index.html, and proxies api and static requests to the Django
 * development server.
 */
import { defineConfig, type ConfigEnv, type PluginOption, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import { createRequire } from "module";
import path from "path";
import packageJson from "./package.json" with { type: "json" };

const packageName = packageJson.name;
const require = createRequire(import.meta.url);

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

/**
 * The vendor chunk: the packages that the app imports when it loads, which change less often than
 * the app, so the browser can keep them cached when it changes. Mermaid is left out, as are the
 * packages that only it uses, including its own copies of katex and marked, because it is imported
 * only when a message has a diagram, and is downloaded only then. See src/lib/mermaid.ts.
 */
const VENDOR_PACKAGES = new Set([
  ...Object.keys(packageJson.dependencies).filter((name) => name !== "mermaid"),
  ...Object.keys(packageJson.peerDependencies),
  "scheduler",
]);

function vendorChunk(id: string): string | undefined {
  if (id.includes("/node_modules/mermaid/")) return undefined;
  // the package of the innermost node_modules directory, e.g. "katex" or "@chatscope/chat-ui-kit-react".
  const name = /.*\/node_modules\/((?:@[^/]+\/)?[^/]+)\//.exec(id)?.[1];
  return name && VENDOR_PACKAGES.has(name) ? "vendor" : undefined;
}

const resolve = {
  alias: {
    "@": path.resolve(import.meta.dirname, "./src"),
  },
};

/**
 * Vite Plugin: withoutKatexCss
 *
 * Leaves KaTeX's css, which src/lib/math.ts imports, out of the library's ui-chat.css. Library mode
 * inlines every asset, and KaTeX's 60 font files would add 1.5 MB to the css of every page that
 * embeds the chat. Instead, pages that display math import "katex/dist/katex.min.css" themselves,
 * and their bundler emits the fonts as files, which browsers download only when they are used.
 */
const KATEX_CSS = "katex/dist/katex.min.css";
const withoutKatexCss: PluginOption = {
  name: "without-katex-css",
  enforce: "pre",
  resolveId: (id: string) => (id === KATEX_CSS ? `\0${KATEX_CSS}` : undefined),
  load: (id: string) => (id === `\0${KATEX_CSS}` ? "" : undefined),
};

/**
 * Vite Plugin: embedCss
 *
 * In the embed script, every css import becomes a module that passes the css, as a string, to addCss() in
 * src/embed/css.ts, which puts it in each chat's shadow root, rather than in the page. The css is compiled by Vite,
 * as usual, through its "?inline" query. KaTeX's css is the exception: its fonts are referred to by their url beside
 * embed.js (__SMARTER_CHAT_ASSETS__/katex/fonts/), in woff2 only, which every browser that runs the embed script
 * supports, and the fonts are copied there, rather than inlined, which would add 1.5 MB to the script.
 */
const EMBED_CSS_PREFIX = "\0smarter-chat-embed-css:";
const CSS_REGISTRY = path.resolve(import.meta.dirname, "src/embed/css.ts");
const katexDir = () => path.dirname(require.resolve("katex/package.json"));

function katexEmbedCss(css: string): string {
  return css.replace(
    /src:\s*url\(fonts\/([\w-]+)\.woff2\)\s*format\("woff2"\)[^;}]*/g,
    'src:url(__SMARTER_CHAT_ASSETS__/katex/fonts/$1.woff2) format("woff2")',
  );
}

const embedCss: PluginOption = {
  name: "smarter-chat-embed-css",
  enforce: "pre",
  async resolveId(source, importer, options) {
    if (!/\.css$/.test(source) || source.startsWith("\0")) return null;
    const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
    // ".js", so that Vite's own css plugin leaves the generated module alone.
    return resolved ? `${EMBED_CSS_PREFIX}${resolved.id}.js` : null;
  },
  load(id) {
    if (!id.startsWith(EMBED_CSS_PREFIX)) return null;
    const file = id.slice(EMBED_CSS_PREFIX.length, -".js".length);
    const registry = `import { addCss } from ${JSON.stringify(CSS_REGISTRY)};\n`;
    if (file.replaceAll("\\", "/").endsWith(KATEX_CSS)) {
      return `${registry}addCss(${JSON.stringify(katexEmbedCss(fs.readFileSync(file, "utf-8")))});\n`;
    }
    return `${registry}import css from ${JSON.stringify(`${file}?inline`)};\naddCss(css);\n`;
  },
  generateBundle() {
    const fontsDir = path.join(katexDir(), "dist", "fonts");
    for (const font of fs.readdirSync(fontsDir).filter((name) => name.endsWith(".woff2"))) {
      this.emitFile({
        type: "asset",
        fileName: `embed/katex/fonts/${font}`,
        source: fs.readFileSync(path.join(fontsDir, font)),
      });
    }
  },
};

/**
 * Vite Plugin: embedMermaidImport
 *
 * Replaces src/lib/mermaidImport.ts, which imports mermaid from the page's bundle, with src/embed/mermaidImport.ts,
 * which imports the separate build of mermaid beside embed.js. A classic script can't be split into chunks.
 */
const MERMAID_IMPORT = path.resolve(import.meta.dirname, "src/lib/mermaidImport.ts");
const embedMermaidImport: PluginOption = {
  name: "smarter-chat-embed-mermaid-import",
  enforce: "pre",
  async resolveId(source, importer, options) {
    if (!source.endsWith("mermaidImport") || !importer) return null;
    const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
    return resolved?.id === MERMAID_IMPORT ? path.resolve(import.meta.dirname, "src/embed/mermaidImport.ts") : null;
  },
};

// library mode leaves process.env.NODE_ENV to the page's bundler. A web page has neither, so the embed script is
// React's production build.
const productionDefine = { "process.env.NODE_ENV": JSON.stringify("production") };

/** The embed script: dist/embed.js, and KaTeX's fonts in dist/embed/katex/fonts/. */
function embedConfig(): UserConfig {
  return {
    plugins: [react(), embedMermaidImport, embedCss],
    resolve,
    define: productionDefine,
    build: {
      outDir: "dist",
      // after build:lib, whose files stay.
      emptyOutDir: false,
      sourcemap: true,
      lib: {
        entry: path.resolve(import.meta.dirname, "src/embed/index.ts"),
        name: "SmarterChatEmbed",
        formats: ["iife"],
        fileName: () => "embed.js",
      },
      rolldownOptions: {
        output: { minify },
      },
    },
  };
}

/** Mermaid, for the embed script: an ES module with its own chunks, in dist/embed/mermaid/. */
function embedMermaidConfig(): UserConfig {
  return {
    define: productionDefine,
    build: {
      outDir: "dist/embed/mermaid",
      emptyOutDir: true,
      lib: {
        entry: path.resolve(import.meta.dirname, "src/embed/mermaid.ts"),
        formats: ["es"],
        fileName: () => "mermaid.js",
      },
      rolldownOptions: {
        output: { chunkFileNames: "[name]-[hash].js", minify },
      },
    },
  };
}

/** The npm library: @smarter.sh/ui-chat. */
function libraryConfig(): UserConfig {
  return {
    plugins: [react(), withoutKatexCss],
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
        // React is a peer dependency. Mermaid is a dependency that the library imports only when a
        // message has a diagram, so it is left to the page's bundler, which splits it into chunks
        // that are downloaded only then, rather than adding 1.2 MB, gzipped, to the library.
        external: ["react", "react-dom", "react/jsx-runtime", "mermaid"],
        output: {
          globals: {
            react: "React",
            "react-dom": "ReactDOM",
            "react/jsx-runtime": "jsxRuntime",
            mermaid: "mermaid",
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
          manualChunks: vendorChunk,
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

export default defineConfig(({ command, mode }: ConfigEnv) => {
  if (mode === "lib") return libraryConfig();
  if (mode === "embed") return embedConfig();
  if (mode === "embed-mermaid") return embedMermaidConfig();
  return appConfig(command);
});
