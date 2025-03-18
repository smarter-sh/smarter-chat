# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).

## 0.2.7

- add csrftoken param in SmarterChat

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
