SHELL := /bin/bash
include .env
export

ifneq ("$(wildcard .env)","")
else
    $(shell cp ./doc/example-dot-env .env)
endif

.PHONY: help init run build update clean lint analyze release pre-commit-init pre-commit-run

# Default target executed when no arguments are given to make.
all: help

# initialize local development environment.
# takes around 5 minutes to complete
init:
	make tear-down			# start w a clean environment
	make pre-commit-init	# install and configure pre-commit

clean:
	make clean

# ---------------------------------------------------------
# Code management
# ---------------------------------------------------------

lint:
	make lint

analyze:
	cloc . --exclude-ext=svg,json,zip --fullpath --not-match-d=smarter/smarter/static/assets/ --vcs=git

pre-commit-init:
	pre-commit install
	pre-commit autoupdate
	pre-commit run --all-files

pre-commit-run:
	pre-commit run --all-files

release:
	git commit -m "fix: force a new release" --allow-empty && git push

# ---------------------------------------------------------
# React app
# ---------------------------------------------------------
clean:
	rm -rf node_modules
	rm -rf dist

init:
	make clean
	npm install
	cd npm install && npm init @eslint/config

lint:
	npm run lint
	npx prettier --write "./src/**/*.{js,cjs,jsx,ts,tsx,json,css,scss,md}"

update:
	npm install -g npm
	npm install -g npm-check-updates
	ncu --upgrade --packageFile package.json
	npm update -g
	npm install

run:
	npm run dev

build:
	npm run build



######################
# HELP
######################

help:
	@echo '===================================================================='
	@echo 'init             - Run npm install for React app'
	@echo 'build            - Build the React app for production'
	@echo 'run              - Run the React app in development mode'
	@echo 'release          - Force new releases to npm and Github release'
	@echo 'clean            - Remove node_modules directories for React app'
	@echo 'lint             - Run npm lint for React app'
	@echo 'update           - Update npm packages for React app'
	@echo 'analyze          - Generate code analysis report using cloc'
	@echo 'pre-commit-init  - install and configure pre-commit'
	@echo 'pre-commit-run   - runs all pre-commit hooks on all files'
	@echo '===================================================================='
