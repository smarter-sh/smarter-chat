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

.PHONY: help init run build update clean lint analyze release pre-commit-init pre-commit-run

# Default target executed when no arguments are given to make.
all: help

clean:
	rm -rf node_modules
	rm -rf dist

init:
	make clean
	npm install
	cd npm install && npm init @eslint/config

analyze:
	cloc . --exclude-ext=svg,json,zip --fullpath --not-match-d=smarter/smarter/static/assets/ --vcs=git

pre-commit:
	pre-commit run --all-files

release:
	git commit -m "fix: force a new release" --allow-empty && git push

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


# ---------------------------------------------------------
# Python
# ---------------------------------------------------------
check-python:
	@command -v $(PYTHON) >/dev/null 2>&1 || { echo >&2 "This project requires $(PYTHON) but it's not installed.  Aborting."; exit 1; }

python-init:
	mkdir -p .pypi_cache && \
	make check-python
	make python-clean && \
	$(PYTHON) -m venv venv && \
	$(ACTIVATE_VENV) && \
	PIP_CACHE_DIR=.pypi_cache $(PIP) install --upgrade pip && \
	PIP_CACHE_DIR=.pypi_cache $(PIP) install -r requirements/local.txt
	source venv/bin/activate
	pre-commit install
	pre-commit autoupdate

python-lint:
	make check-python
	make pre-commit-run

python-clean:
	rm -rf venv
	find ./ -name __pycache__ -type d -exec rm -rf {} +

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
