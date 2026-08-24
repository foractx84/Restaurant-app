#!/bin/bash

set -e

if [ ! -d "src" ]; then
  echo "ERROR: You need to run this script from the project's root folder."
  exit 9999 # die with error code 9999
else

  if [ "$1" = "local" ]; then
      echo "Using local database (use port 2346)"
  else
      echo "Loading latest test database from Artifact Registry"

      docker pull us-east1-docker.pkg.dev/taptab-cloud-infrastructure/database/taptab-test-database:latest || { echo "Could not fetch image from registry, please check your credentials file."; exit 1; }
      docker container stop taptab-integration-test-database || true
      docker container rm taptab-integration-test-database || true
      docker run -dt \
        --name taptab-integration-test-database \
        -p 2346:5432 \
        us-east1-docker.pkg.dev/taptab-cloud-infrastructure/database/taptab-test-database:latest
  fi

  export DB_PORT=2346 DB_HOST=localhost DB_USER=ttdbadmin DB_PASSWORD=taptabtestdb DB_NAME=taptabdb
  # Required for Stripe Connect onboarding URL validation when creating restaurants (createConnectedAccountForRestaurant)
  export TAP_MANAGER_URL="${TAP_MANAGER_URL:-https://manager.example.com}"

  sleep 3

  echo "Starting ordered integration tests..."

  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/media.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/announcements.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/stripe.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/login.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/managers.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/auth.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/restaurant.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/menus.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/menuSections.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/menuItems.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/modifiers.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/modifierGroups.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/drinkItems.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/profilePages.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/profileSections.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/dietaryRestrictions.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/tags.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/titles.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/menuLayouts.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/cuisines.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/discoveryContent.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/cateringRequests.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/eventRequests.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/otterIntegration.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/menuSnapshot.test.ts
  sleep 3
  jest --runInBand --forceExit --passWithNoTests src/__tests__/integration/modifierSchema.test.ts

  echo "Ending ordered integrations tests..."

  echo "Test database container kept alive. Stop and delete container manually if needed."

fi
