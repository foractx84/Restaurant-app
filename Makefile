#------------------------------------------------------------------------------------------
# Variables
PROJECT_ID=taptab-cloud-infrastructure
REGION=us-east1
GITHUB_SHA?=local
GITHUB_SHA_SHORT?=$(shell git rev-parse --short HEAD)
CONTAINER_NAME=superbackend-$(ENV)
VERSION:=$(shell echo $$(node -p -e "require('./package.json').version";))
BUILD=$(GITHUB_SHA_SHORT)
REGISTRY_URL=$(REGION)-docker.pkg.dev
REPO_NAME=superbackend-$(ENV)
LOCAL_TAG=superbackend-$(ENV)
REMOTE_TAG=$(REGISTRY_URL)/$(PROJECT_ID)/$(REPO_NAME)/$(LOCAL_TAG)
ROLLBACK?=latest
API_PORT=3000
NODE_ENV?=development

#------------------------------------------------------------------------------------------
# Telling make that these functions won't output files.
.PHONY: check-env get-secret build buildx build-local run push deploy rollback

#------------------------------------------------------------------------------------------
# Helper function to check if the environment is set and to change NODE_ENV. Cloud envs are
# [dev|staging|prod] but NODE_ENV should be [development|staging|production].
# To use, just set an environment before launching one of the commands
# below, such as: `ENV=dev make docker-build`.

ENVIRONMENTS := dev staging prod

check-env:
ifeq ($(filter $(ENV),$(ENVIRONMENTS)),)
    $(error Please set ENV=[dev|staging|prod])
endif
ifeq ($(ENV),dev)
NODE_ENV := development
else ifeq ($(ENV),prod)
NODE_ENV := production
endif

#------------------------------------------------------------------------------------------
# Helper function to fetch secrets from GCP.
# This cannot be indented or else make will include spaces in front of secret
define get-secret
$(shell gcloud secrets versions access latest --secret=$(1) --project=$(PROJECT_ID))
endef

#------------------------------------------------------------------------------------------
# Build docker image.
# --- ATTENTION ---
# Intended to be used by GH Actions only.
# This will override your local .env file!
# Use the build-local command to run with an existing .env file with all variables needed in it.
# The variables below are the only ones needed for a cloud build, the rest will be fetched from Google Secrets.
build: check-env
	@echo MODE=http > .env && \
		echo SERVER=google-cloud >> .env && \
		echo NODE_ENV=$(NODE_ENV) >> .env && \
		echo API_PORT=$(API_PORT) >> .env && \
		echo API_VERSION=$(VERSION) >> .env && \
		echo API_BUILD=$(BUILD) >> .env && \
		docker build -t $(LOCAL_TAG) --platform=linux/amd64 .

# Same as build command but using docker buildx for building and caching.
buildx: check-env
	-docker buildx create --name builder-main --driver docker-container --use
	@echo MODE=http > .env && \
		echo SERVER=google-cloud >> .env && \
		echo NODE_ENV=$(NODE_ENV) >> .env && \
		echo API_PORT=$(API_PORT) >> .env && \
		echo API_VERSION=$(VERSION) >> .env && \
		echo API_BUILD=$(BUILD) >> .env && \
		docker buildx build -t $(LOCAL_TAG) \
			--cache-from=type=local,src=/tmp/.buildx-cache \
			--cache-to=type=local,dest=/tmp/.buildx-cache-new \
			--progress=plain \
			--load \
			--platform=linux/amd64 .

# Build docker image locally using an existing .env file.
build-local: check-env
	docker build -t $(LOCAL_TAG) --platform=linux/amd64 .

#------------------------------------------------------------------------------------------
# Run image built locally. Uses port 3100 to avoid clashes with Backend (3000) and MobileBackend (3200).
run: check-env
	-docker container stop $(CONTAINER_NAME)
	-docker container rm $(CONTAINER_NAME)
	docker run -dit \
		--name $(CONTAINER_NAME) \
		-p 3100:$(API_PORT) \
		--platform=linux/amd64 \
		$(LOCAL_TAG)

#------------------------------------------------------------------------------------------
# Upload to GCP Container Registry
# Example command: ENV=dev make push
push: check-env
	-gcloud auth configure-docker --quiet $(REGION)-docker.pkg.dev
	docker tag $(LOCAL_TAG) $(REMOTE_TAG):$(VERSION)-$(BUILD)
	docker tag $(LOCAL_TAG) $(REMOTE_TAG):latest
	docker push $(REMOTE_TAG) --all-tags

#------------------------------------------------------------------------------------------
# DEPLOY
# To deploy a new revision to Cloud Run based on latest image.
# Example command: ENV=dev make deploy
deploy: check-env
	@gcloud run deploy superbackend-$(ENV) \
		--image=$(REMOTE_TAG):$(VERSION)-$(BUILD) \
		--region=$(REGION) \
		--revision-suffix=v$(subst .,-,$(VERSION))-$(BUILD)
	@gcloud run services update-traffic superbackend-$(ENV) \
		--region=$(REGION) \
		--to-revisions=superbackend-$(ENV)-v$(subst .,-,$(VERSION))-$(BUILD)=100


#------------------------------------------------------------------------------------------
# To roll back traffic to a previous revision. Needs a ROLLBACK=xxx variable with xxx being
# a version and build similar to `vX.X.X-build` matching a deployed version in Cloud Run.
# Example command: ROLLBACK=1.0.5-b8546df ENV=dev make rollback
rollback: check-env
	@gcloud run services update-traffic superbackend-$(ENV) \
		--region=$(REGION) \
		--to-revisions=superbackend-$(ENV)-$(subst .,-,$(ROLLBACK))=100
