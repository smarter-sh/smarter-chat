# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).



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
