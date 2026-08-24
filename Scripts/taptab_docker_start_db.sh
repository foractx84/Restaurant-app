#!/bin/bash

set -e

# Needed to force architecture in M1 Macs.
export DOCKER_DEFAULT_PLATFORM=linux/amd64

if [ ! -d "src" ]; then
  echo "ERROR: You need to run this script from the project's root folder."
  exit 9999 # die with error code 9999
else

  echo "Reloading test database..."

  docker pull us-east1-docker.pkg.dev/taptab-cloud-infrastructure/database/taptab-test-database:latest || { echo "Could not fetch image from registry, please check your credentials file."; exit 1; }
  docker container stop taptab-test-database
  docker container rm taptab-test-database
  docker run -dit \
    --name taptab-test-database \
    -p 2345:5432 \
    us-east1-docker.pkg.dev/taptab-cloud-infrastructure/database/taptab-test-database:latest

  echo "------------------------------------------------"
  echo "Test database running in Docker on port 2345"
  echo "> Database user: ttdbadmin"
  echo "> Database password: taptabtestdb"
  echo "> Database name: taptabdb"
  echo "------------------------------------------------"

fi
