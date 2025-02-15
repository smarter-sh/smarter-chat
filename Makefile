# ---------------------------------------------------------
# Makefile for the React.js app
# ---------------------------------------------------------
@echo 'AWS_PROFILE=$(AWS_PROFILE)'

# Set environment variables based on the git branch name
# aws resources were created by Terraform in the smarter-infrastructure repository
# https://github.com/smarter-sh/smarter-infrastructure
BRANCH_NAME := $(shell git rev-parse --abbrev-ref HEAD)
TARGET_FOLDER := ui-chat
ifeq ($(BRANCH_NAME),main)
    ENVIRONMENT := prod
    BUCKET := platform.smarter.sh
    DISTRIBUTION_ID := E1AQ8TNR0TZNRT
    URL := https://cdn.platform.smarter.sh/$(TARGET_FOLDER)/
else ifeq ($(BRANCH_NAME),alpha)
    ENVIRONMENT := alpha
    BUCKET := alpha.platform.smarter.sh
    URL := https://cdn.alpha.platform.smarter.sh/$(TARGET_FOLDER)/
else ifeq ($(BRANCH_NAME),beta)
    ENVIRONMENT := beta
    BUCKET := beta.platform.smarter.sh
    URL := https://cdn.beta.platform.smarter.sh/$(TARGET_FOLDER)/
else
    ENVIRONMENT := $(BRANCH_NAME)
    BUCKET := no-bucket
    URL := ''
endif
S3_TARGET := s3://$(BUCKET)/$(TARGET_FOLDER)

# Detect the operating system and set the shell accordingly
SHELL := /bin/bash
include .env
export PATH := /usr/local/bin:$(PATH)
export

ifeq ($(OS),Windows_NT)
    AWS_CLI := aws
    PYTHON := python.exe
    ACTIVATE_VENV := venv\Scripts\activate
else
    AWS_CLI := /opt/homebrew/bin/aws
    PYTHON := python3.12
    ACTIVATE_VENV := source venv/bin/activate
endif
PIP := $(PYTHON) -m pip

# Ensure that the .env file exists
ifneq ("$(wildcard .env)","")
else
    $(shell cp ./doc/example-dot-env .env)
endif

.PHONY: help clean npm-check analyze pre-commit lint update python-check python-init init run build release aws-verify-bucket aws-sync-s3 aws-bust-cache
all: help

# ---------------------------------------------------------
# Anciallary tasks
# ---------------------------------------------------------
clean:
	rm -rf .pypi_cache
	rm -rf venv
	rm -rf node_modules
	rm -rf build

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
	@echo 'Building the React app...'
	rm -rf build
	npm run build

aws-verify-bucket:
    # ------------------------
    # Ensure the S3 bucket and folder exist
    # ------------------------
	@echo 'Checking if the S3 bucket $(BUCKET) exists...'
	$(AWS_CLI) s3 ls $(BUCKET) || { echo "aws s3 bucket $(BUCKET) does not exist. Aborting."; exit 1; }
	@echo 'Checking if the S3 bucket folder $(S3_TARGET) exists...'
	$(AWS_CLI) s3 ls $(S3_TARGET) || $(AWS_CLI) s3 put-object --bucket $(BUCKET) --key $(TARGET_FOLDER)/

aws-sync-s3:
    # ------------------------
    # add all built files to the S3 bucket.
    # ------------------------
	@echo 'Syncing the build folder to the S3 bucket...'
	$(AWS_CLI) s3 sync ./build/ $(S3_TARGET) \
				--acl public-read \
				--delete --cache-control max-age=31536000,public \
				--expires '31 Dec 2050 00:00:01 GMT'

aws-bust-cache:
    # ------------------------
    # remove the cache-control header created above with a "no-cache" header so that browsers never cache these files
    # ------------------------
	@echo 'Creating cache invalidations for service-worker.js, index.html, and manifest.json files...'
	$(AWS_CLI) s3 cp $(S3_TARGET)/index.html $(S3_TARGET)/index.html --metadata-directive REPLACE --cache-control max-age=0,no-cache,no-store,must-revalidate --content-type text/html --acl public-read
	$(AWS_CLI) s3 cp $(S3_TARGET)/manifest.json $(S3_TARGET)/manifest.json --metadata-directive REPLACE --cache-control max-age=0,no-cache,no-store,must-revalidate --content-type text/json --acl public-read

    # invalidate the Cloudfront cache
	$(AWS_CLI) cloudfront create-invalidation --distribution-id $(DISTRIBUTION_ID) --paths "/*" "/index.html" "/manifest.json"

release:
    #---------------------------------------------------------
    # usage: deploy prouduction build of chat UI for Smarter Platform
    #        react.js app to AWS S3 bucket.
    #
    # https://gist.github.com/kellyrmilligan/e242d3dc743105fe91a83cc933ee1314
    #
    # 1. Build the React application
    # 2. Upload to AWS S3
    # 3. Invalidate all items in the AWS Cloudfront CDN.
    #---------------------------------------------------------
	make build
	make aws-verify-bucket
	make aws-sync-s3
	make aws-bust-cache


######################
# HELP
######################

help:
	@echo '===================================================================='
	@echo 'smarter-chat customizable react.js app for the Smarter Platform'
	@echo 'AWS_PROFILE=$(AWS_PROFILE)'
	@echo 'environment: $(ENVIRONMENT)'
	@echo 'aws s3 build target: $(S3_TARGET)'
	@echo 'aws cloudfront distribution-id: $(DISTRIBUTION_ID)'
	@echo 'url: $(URL)'
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
	@echo 'aws-verify-bucket- Ensure the S3 bucket and folder exist'
	@echo 'aws-sync-s3	    - Add all built files to the S3 bucket'
	@echo '--------------------------------------------------------------------'
