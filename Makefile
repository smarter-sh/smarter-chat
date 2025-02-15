SHELL := /bin/bash
include .env
export PATH := /usr/local/bin:$(PATH)
export

ifeq ($(OS),Windows_NT)
    PYTHON := python.exe
    ACTIVATE_VENV := venv\Scripts\activate
else
    PYTHON := python3.12
    ACTIVATE_VENV := source venv/bin/activate
endif
PIP := $(PYTHON) -m pip

ifneq ("$(wildcard .env)","")
else
    $(shell cp ./doc/example-dot-env .env)
endif

.PHONY: help clean npm-check analyze pre-commit lint update python-check python-init init run build release

# Default target executed when no arguments are given to make.
all: help

# ---------------------------------------------------------
# Anciallary tasks
# ---------------------------------------------------------
clean:
	rm -rf .pypi_cache
	rm -rf venv
	rm -rf node_modules
	rm -rf dist

npm-check:
	@command -v npm >/dev/null 2>&1 || { echo >&2 "This project requires npm but it's not installed.  Aborting."; exit 1; }

analyze:
	cloc . --exclude-ext=svg,json,zip --fullpath --not-match-d=smarter/smarter/static/assets/ --vcs=git

pre-commit:
	pre-commit run --all-files

lint:
	npm run lint
	npx prettier --write "./src/**/*.{js,cjs,jsx,ts,tsx,json,css,scss,md}"

update:
	npm install -g npm
	npm install -g npm-check-updates
	ncu --upgrade --packageFile package.json
	npm update -g
	npm install

# ---------------------------------------------------------
# Python
# for pre-commit and code quality checks.
# ---------------------------------------------------------
python-check:
	@command -v $(PYTHON) >/dev/null 2>&1 || { echo >&2 "This project requires $(PYTHON) but it's not installed.  Aborting."; exit 1; }

python-init:
	mkdir -p .pypi_cache && \
	make python-check
	make python-clean && \
	$(PYTHON) -m venv venv && \
	$(ACTIVATE_VENV) && \
	PIP_CACHE_DIR=.pypi_cache $(PIP) install --upgrade pip && \
	PIP_CACHE_DIR=.pypi_cache $(PIP) install -r requirements/local.txt
	source venv/bin/activate
	pre-commit install
	pre-commit autoupdate

# ---------------------------------------------------------
# Primary targets
# ---------------------------------------------------------
init:
	make npm-check
	make clean
	npm install
	cd npm install && npm init @eslint/config

run:
	npm run dev

build:
	npm run build

release:
	git commit -m "fix: force a new release" --allow-empty && git push


######################
# HELP
######################

help:
	@echo '===================================================================='
	@echo 'init             - Run npm install for React app'
	@echo 'build            - Build the React app for production'
	@echo 'run              - Run the React app in development mode'
	@echo 'release          - Force new releases to npm and Github release'
	@echo '-----------------------OTHER TASKS----------------------------------'
	@echo 'npm-check        - Ensure that npm is installed'
	@echo 'clean            - Remove node_modules directories for React app'
	@echo 'lint             - Run npm lint for React app'
	@echo 'update           - Update npm packages for React app'
	@echo 'analyze          - Generate code analysis report using cloc'
	@echo 'python-check     - Ensure that Python is installed'
	@echo 'python-init      - Create Python virtual environment and install dependencies'
	@echo 'pre-commit       - runs all pre-commit hooks on all files'
	@echo '===================================================================='
