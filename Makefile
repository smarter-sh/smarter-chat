# ---------------------------------------------------------
# Makefile for Smarter Chat
#
# Smarter Chat is developed inside the npm workspace of
# https://github.com/smarter-sh/smarter, which clones this
# repository into smarter/react/packages/smarter-chat. These
# targets run there. See README.md.
# ---------------------------------------------------------

SHELL := /bin/bash
WORKSPACE := ../..
PYTHON := python3.13
ACTIVATE_VENV := source venv/bin/activate

.PHONY: help init run build build-lib test lint storybook release pre-commit python-init clean
all: help

init:
	cd $(WORKSPACE) && npm install --include=dev

run:
	npm run dev

build:
	npm run build

build-lib:
	npm run build:lib

test:
	npm test

lint:
	npm run lint && npm run typecheck && cd $(WORKSPACE) && npx prettier --check packages/smarter-chat

storybook:
	npm run storybook

# Publish the npm package, @smarter.sh/ui-chat. prepublishOnly builds it first.
release:
	npm publish --access public

pre-commit:
	pre-commit run --all-files

python-init:
	$(PYTHON) -m venv venv && \
	$(ACTIVATE_VENV) && \
	pip install --upgrade pip && \
	pip install -r requirements/local.txt && \
	pre-commit install

clean:
	rm -rf dist venv

help:
	@echo '===================================================================='
	@echo 'Smarter Chat: the React chat component of https://smarter.sh'
	@echo '===================================================================='
	@echo 'init             - npm install, in the Smarter React workspace'
	@echo 'run              - Run the app with the Vite dev server'
	@echo 'build            - Build the app into the Smarter web console static files'
	@echo 'build-lib        - Build the npm package into dist/'
	@echo 'test             - Run the unit tests'
	@echo 'lint             - Lint, type-check and check formatting'
	@echo 'storybook        - Browse the components in Storybook'
	@echo 'release          - Publish the npm package'
	@echo 'python-init      - Create a Python virtual environment, for pre-commit'
	@echo 'pre-commit       - Run all pre-commit hooks on all files'
	@echo 'clean            - Remove dist/ and venv/'
	@echo '--------------------------------------------------------------------'
