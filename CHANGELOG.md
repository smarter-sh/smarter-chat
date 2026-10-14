# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).



## [0.9.0-alpha.1](https://github.com/smarter-sh/smarter-chat/compare/v0.8.0...v0.9.0-alpha.1) (2026-10-14)

### Features

* **embed:** add a self-contained embed script for any web page ([83c7e47](https://github.com/smarter-sh/smarter-chat/commit/83c7e47e83b33731dd149a1384fdc7b0c5cc9acd))

## [0.8.0](https://github.com/smarter-sh/smarter-chat/compare/v0.7.1...v0.8.0) (2026-10-12)

### Features

* **chat:** add a sandbox-mode Docs button with technical references ([beab9cb](https://github.com/smarter-sh/smarter-chat/commit/beab9cbf97401cb7eefb3a98fbc60b7570c3239f))
* **chat:** apply the LLMClient's styles to the chat ([afb1b5e](https://github.com/smarter-sh/smarter-chat/commit/afb1b5e637e97e629b24b50cb98ec0adfb985528))
* **chat:** hide the console and its toggle in production mode ([8eb2b1b](https://github.com/smarter-sh/smarter-chat/commit/8eb2b1b13fdc318d193ecc8cd248fdfd599b7594))

## [0.8.0-alpha.3](https://github.com/smarter-sh/smarter-chat/compare/v0.8.0-alpha.2...v0.8.0-alpha.3) (2026-10-12)

### Features

* **chat:** hide the console and its toggle in production mode ([8eb2b1b](https://github.com/smarter-sh/smarter-chat/commit/8eb2b1b13fdc318d193ecc8cd248fdfd599b7594))

## [0.8.0-alpha.2](https://github.com/smarter-sh/smarter-chat/compare/v0.8.0-alpha.1...v0.8.0-alpha.2) (2026-10-12)

### Features

* **chat:** apply the LLMClient's styles to the chat ([afb1b5e](https://github.com/smarter-sh/smarter-chat/commit/afb1b5e637e97e629b24b50cb98ec0adfb985528))

## [0.8.0-alpha.1](https://github.com/smarter-sh/smarter-chat/compare/v0.7.1...v0.8.0-alpha.1) (2026-10-12)

### Features

* **chat:** add a sandbox-mode Docs button with technical references ([beab9cb](https://github.com/smarter-sh/smarter-chat/commit/beab9cbf97401cb7eefb3a98fbc60b7570c3239f))

## [0.7.1](https://github.com/smarter-sh/smarter-chat/compare/v0.7.0...v0.7.1) (2026-10-11)

### Bug Fixes

* **api:** enforce the chat api contract with generated types ([cd61f2e](https://github.com/smarter-sh/smarter-chat/commit/cd61f2ee783927b203ad5d08164189f1c4c895f8))

### Refactoring

* replace relative tsx imports with the @ alias ([de0239f](https://github.com/smarter-sh/smarter-chat/commit/de0239fd1c11093e65f73fa31cd2184224a62ffa))

## [0.7.0](https://github.com/smarter-sh/smarter-chat/compare/v0.6.0...v0.7.0) (2026-10-09)

### Features

* draw mermaid diagrams and tie server logs to chat mode ([1979b87](https://github.com/smarter-sh/smarter-chat/commit/1979b8740273c31fbf644f2d0d16409583da124a))
* typeset LaTeX math in responses with KaTeX ([3aaf694](https://github.com/smarter-sh/smarter-chat/commit/3aaf69421224b2f36ea13d08614e877d42de6215))

## [0.7.0-alpha.1](https://github.com/smarter-sh/smarter-chat/compare/v0.6.0...v0.7.0-alpha.1) (2026-10-09)

### Features

* draw mermaid diagrams and tie server logs to chat mode ([1979b87](https://github.com/smarter-sh/smarter-chat/commit/1979b8740273c31fbf644f2d0d16409583da124a))
* typeset LaTeX math in responses with KaTeX ([3aaf694](https://github.com/smarter-sh/smarter-chat/commit/3aaf69421224b2f36ea13d08614e877d42de6215))

## [0.6.0](https://github.com/smarter-sh/smarter-chat/compare/v0.5.0...v0.6.0) (2026-10-08)

### Features

* highlight code blocks and explain max-token cutoffs ([8e625dd](https://github.com/smarter-sh/smarter-chat/commit/8e625dd5c7154026fd426aaff87f5e7c33d1e78c))

## [0.6.0-alpha.1](https://github.com/smarter-sh/smarter-chat/compare/v0.5.0...v0.6.0-alpha.1) (2026-10-08)

### Features

* highlight code blocks and explain max-token cutoffs ([8e625dd](https://github.com/smarter-sh/smarter-chat/commit/8e625dd5c7154026fd426aaff87f5e7c33d1e78c))

## [0.5.0](https://github.com/smarter-sh/smarter-chat/compare/v0.4.0...v0.5.0) (2026-10-08)

### Features

* markdown responses, ansi server logs, sliding console, new toolbar ([7d115ac](https://github.com/smarter-sh/smarter-chat/commit/7d115ac14be924a2e4f5f1269da9ef764796f8f2)), closes [#171b20](https://github.com/smarter-sh/smarter-chat/issues/171b20)

## [0.5.0-alpha.1](https://github.com/smarter-sh/smarter-chat/compare/v0.4.0...v0.5.0-alpha.1) (2026-10-08)

### Features

* markdown responses, ansi server logs, sliding console, new toolbar ([7d115ac](https://github.com/smarter-sh/smarter-chat/commit/7d115ac14be924a2e4f5f1269da9ef764796f8f2)), closes [#171b20](https://github.com/smarter-sh/smarter-chat/issues/171b20)

## [0.4.0](https://github.com/smarter-sh/smarter-chat/compare/v0.3.0...v0.4.0) (2026-10-07)

### ⚠ BREAKING CHANGES

* version 0.4.0. ConfigPropTypes is no longer exported. Use the exported TypeScript types instead (ChatConfig, SmarterChatProps, ...). authSessionCookieName is deprecated and unused. React 19 is a peer dependency. The SmarterChat props, the Console, MenuItems, the message enums, version and the ui-chat.css path are unchanged. SenderRoleEnum gains SMARTER_ERROR.

Co-authored-by: Lawrence McDaniel <lpm0073@gmail.com>

### Features

* asynchronous chat support and server log streams ([1216746](https://github.com/smarter-sh/smarter-chat/commit/12167467e86724e67ea28c44e38f1ee032635dce))

### Bug Fixes

* **console:** read llmclient_request_history, move Config tab last ([2e4ae62](https://github.com/smarter-sh/smarter-chat/commit/2e4ae62bdadec1b8bd002bf491d9e1e161daf00d))

### Refactoring

* rewrite in typescript as a smarter react workspace package ([3c665b4](https://github.com/smarter-sh/smarter-chat/commit/3c665b4bc9383d6b70f026c59b4fbfc525161f1c))

## [0.4.0-alpha.1](https://github.com/smarter-sh/smarter-chat/compare/v0.3.1-alpha.1...v0.4.0-alpha.1) (2026-10-07)

### Features

* asynchronous chat support and server log streams ([1216746](https://github.com/smarter-sh/smarter-chat/commit/12167467e86724e67ea28c44e38f1ee032635dce))

## [0.3.1-alpha.1](https://github.com/smarter-sh/smarter-chat/compare/v0.3.0...v0.3.1-alpha.1) (2026-10-07)

### ⚠ BREAKING CHANGES

* version 0.4.0. ConfigPropTypes is no longer exported. Use the exported TypeScript types instead (ChatConfig, SmarterChatProps, ...). authSessionCookieName is deprecated and unused. React 19 is a peer dependency. The SmarterChat props, the Console, MenuItems, the message enums, version and the ui-chat.css path are unchanged. SenderRoleEnum gains SMARTER_ERROR.

Co-authored-by: Lawrence McDaniel <lpm0073@gmail.com>

### Bug Fixes

* **console:** read llmclient_request_history, move Config tab last ([2e4ae62](https://github.com/smarter-sh/smarter-chat/commit/2e4ae62bdadec1b8bd002bf491d9e1e161daf00d))

### Refactoring

* rewrite in typescript as a smarter react workspace package ([3c665b4](https://github.com/smarter-sh/smarter-chat/commit/3c665b4bc9383d6b70f026c59b4fbfc525161f1c))

## 0.2.14

- bug fix in Component.jsx - setCookie(cookies.debugCookie, debugModeState)

## 0.2.13

- left-align section.smarter-message

## 0.2.10 - 0.2.12

- minor patches and version bumps

## 0.2.9

- add csrftoken param in SmarterChat
- lint and package for shipping

## 0.2.6

- restrict reading cookies to the cookie domain passed in to SmarterChat. example: alpha.platform.smarter.sh is permitted, while say, platform.smarter.sh and smarter.sh are ignored.

## 0.2.5

- add startup params for authSessionCookieName and cookieDomain.

## 0.2.1

- integrate Console to SmarterChat as include by default.
- create a PropTypes definition for config object
- validate config object in SmarterChat fetch
- export all enumerated data types, Console, and PropTypes

## 0.2.0

- add server console output.

## 0.1.4

- add a version export

## 0.1.1

- base feature set
