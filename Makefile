# ---------------------------------------------------------
# Makefile for Smarter Chat
#
# These targets work in a plain clone of this repository,
# and inside the npm workspace of
# https://github.com/smarter-sh/smarter, which clones it
# into smarter/react/packages/smarter-chat. There, npm
# installs the dependencies once, for the whole workspace,
# and `make build` builds the app into Django's static
# directory. See README.md.
#
# The Smarter backend is optional: `make serve` runs the
# component in Storybook, whose stories mock the Smarter
# API. `make run` runs the app against a local Smarter
# dev server instead.
# ---------------------------------------------------------

SHELL := /bin/bash
PYTHON := python3.13
ACTIVATE_VENV := source venv/bin/activate

# The Smarter React workspace, if this package is inside one.
WORKSPACE := ../..
IN_WORKSPACE := $(shell grep -qs '"packages/\*"' $(WORKSPACE)/package.json && echo true)

.PHONY: help init serve run build test coverage lint format release pre-commit-init pre-commit-run python-init clean
all: help

init:
ifeq ($(IN_WORKSPACE),true)
	cd $(WORKSPACE) && npm install --include=dev
else
	npm install --include=dev
endif

# Storybook, at http://localhost:6006. The stories mock the Smarter API, and use the
# web console's stylesheets when the Smarter dev server is running, or Bootstrap if not.
serve:
	npm run storybook

# The app with the Vite dev server, against the Smarter dev server at http://localhost:9357.
run:
	npm run dev

# The app, and the npm package into dist/.
build:
	npm run build
	npm run build:lib

test:
	npm test

# The tests, with a coverage report in coverage/.
coverage:
	npm run coverage

lint:
	npm run lint && npm run typecheck && npm run format:check

format:
	npm run format

# Publish the npm package, @smarter.sh/ui-chat, once the tests pass.
# prepublishOnly builds it first.
release: test
	npm publish --access public

# Installs the pre-commit and commit-msg hooks. See .pre-commit-config.yaml.
pre-commit-init:
	pre-commit install
	pre-commit autoupdate

pre-commit-run:
	pre-commit run --all-files

python-init:
	$(PYTHON) -m venv venv && \
	$(ACTIVATE_VENV) && \
	pip install --upgrade pip && \
	pip install -r requirements/local.txt && \
	pre-commit install

clean:
	rm -rf build dist coverage storybook-static venv

help:
	@echo '===================================================================='
	@echo 'Smarter Chat: the React chat component of https://smarter.sh'
	@echo '===================================================================='
	@echo 'init             - npm install (in the Smarter React workspace, if inside one)'
	@echo 'serve            - Browse the component in Storybook. No Smarter backend needed'
	@echo 'run              - Run the app against the Smarter dev server (localhost:9357)'
	@echo 'build            - Build the app, and the npm package into dist/'
	@echo 'test             - Run the unit tests'
	@echo 'coverage         - Run the unit tests with a coverage report in coverage/'
	@echo 'lint             - Lint, type-check and check formatting'
	@echo 'format           - Format the code with Prettier'
	@echo 'release          - Run the tests, then publish the npm package'
	@echo 'python-init      - Create a Python virtual environment, for pre-commit'
	@echo 'pre-commit-init  - Install the pre-commit and commit-msg hooks'
	@echo 'pre-commit-run   - Run all pre-commit hooks on all files'
	@echo 'clean            - Remove build output, coverage and venv/'
	@echo '--------------------------------------------------------------------'
