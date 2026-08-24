# Change log

## [Version v1.0.X (PENDING)](https://github.com/taptabapp/super-backend/releases/tag/v1.0.X)
### Changes
- [ADD] Restaurants can now configure a modifier group as single-selection (radio button, e.g. steak temperature) or multi-selection (checkbox, e.g. pizza toppings) via `minimumSelections`/`maximumSelections` on `CreateModifierGroupDto`/`EditModifierGroupDto`, with an optional `maxPerModifierSelectionQuantity` cap on duplicate picks of the same modifier. Reuses columns added in TAB-425 for Otter, previously only populated by Otter sync (TAB-465)
- [ADD] Real-DB integration tests for the full Otter flow (`src/__tests__/integration/otterIntegration.test.ts`): OAuth connect (creates a real restaurant + platform integration), pull sync (`processOtterMenuSyncJob` writes real menu rows from a mocked Otter response), and push (`POST /otter/menu-push` reads real seeded menu rows and sends a correctly-built payload). Only the Otter HTTP boundary is mocked; controllers/services/DB run for real
- [FIX] `mapOtterOrgStoreToRestaurant` no longer passes Otter's `countryCode` (an ISO code, e.g. `"US"`) into `checkCountryExistsByName`, which expects a full country name (e.g. `"United States"`) — this broke real OAuth onboarding for any store where Otter returns a countryCode, caught by the new integration test
- [ADD] POST `/otter/menu-push` (authenticated): pushes a restaurant's complete current menu to Otter via `POST /v1/menus` (full-replacement semantics), polling the resulting async job for the common fast-resolving case. Requires the `menus.upsert` and `menus.async_job.read` scopes. v1 scope: base item size only, no photos/price overrides/SKU data/nested modifier groups
- [ADD] `buildOtterMenusUpsertRequest` (`src/utils/denormalizeOtterMenu.ts`): denormalizes TapTab's own menu data into Otter's upload shape, the reverse of `normalizeOtterMenus`
- [ADD] `RestaurantGroupEntity`/`BrandEntity` mirroring new `restaurant_groups`/`brands` tables (UUID primary keys), plus `RestaurantEntity.brand_id`/`brand` for a restaurant group -> brand -> restaurant hierarchy (e.g. Yum Brands as a "restaurant group" operating several brands). Schema-only: no service/controller/route CRUD layer yet (TAB-383)
- [ADD] `menu_snapshots` storage layer now supports `external_party: 'otter'` in addition to `'checkmate'` (`EXTERNAL_PARTY` constant added; `RestaurantMenuSnapshotModel`/`Service` already accepted an `externalParty` parameter, no schema change needed) (TAB-423)
- [ADD] unit tests for `restaurantMenuSnapshot` model/service and `hashUtils.generateHash`, plus an integration test proving otter/checkmate snapshots stay independently retrievable by restaurant + external_party (TAB-423)
- [UPDATE] switch Otter store onboarding from the `stores.upsert` account-pairing webhook to OAuth authorization-code organization onboarding, per Otter's guidance that we're on the Onboarding workflow
- [ADD] GET `/otter/auth/authorize` to start the Otter OAuth consent flow
- [ADD] GET `/otter/auth/callback` to exchange the authorization code and connect/create the matching restaurant via Otter's organization brands/stores/connection API
- [REMOVE] `stores.upsert` webhook onboarding path (`OTTER_STORE_UPSERT` queue, `OtterStoreService`, upsert payload types) — no longer applicable under the Onboarding workflow
- [ADD] gap analysis + schema extensions for Otter's modifier model: `modifier_groups.minimum_selections`/`maximum_selections`/`max_per_modifier_selection_quantity`, `modifier_group_to_modifier_link` (nested modifier groups), `modifier_price_overrides` (per-channel modifier pricing). Additive only; existing Checkmate modifier read/write paths unaffected (TAB-425)
- [ADD] GET `/fonts` endpoint returning the selectable font allowlist for restaurant design (TAB-360)
- [ADD] GET `/restaurant/design/fonts` endpoint returning per-restaurant typography settings merged with defaults (TAB-360)
- [ADD] PUT `/restaurant/design/fonts` endpoint to save typography settings for navigation, body, headers, menus, and menu items (TAB-360)
- [ADD] GET `/restaurant/design/colors` endpoint returning per-restaurant site colors merged with defaults (TAB-360)
- [ADD] PUT `/restaurant/design/colors` endpoint to save navigation, website, and online ordering background colors (TAB-360)
- [FIX] reject PUT `/restaurant/design/fonts` when `fontFamily` is not in the selectable fonts allowlist (TAB-360)
- [FIX] PUT `/restaurant/design/fonts` returns merged settings from the persisted row instead of echoing the request body (TAB-360)
- [ADD] unit tests for fonts and restaurant typography services and controllers (TAB-360)
- [FIX] validate gallery image IDs against the correct arrays when uploading restaurant images
- [FIX] rename `tags.mddileware.ts` to `tags.middleware.ts`
- [FIX] `start-local`, `start-dev`, `start-stage`, and `start-prod` scripts so `NODE_ENV` is passed through to Node (enables Swagger on `start-local`)
- [ADD] Otter menu sync engine: fetches the current menu from Otter's `GET /v1/menus`, normalizes it into the shared `NormalizedMenu[]` shape, diffs it against the last `'otter'` snapshot using the existing (platform-agnostic) diff pipeline, applies additions/updates/removals of menus/sections/items/modifier groups/modifiers, and writes the new snapshot (TAB-428)
- [ADD] `normalizeOtterMenus`: walks Otter's flat `menus`/`categories`/`items`/`modifierGroups` graph into the nested `NormalizedMenu[]` tree the sync pipeline expects, converting `Money.amount` decimal dollars to integer cents; nested modifiers, min/max selection rules, and price overrides are deferred to a fast-follow (TAB-428)
- [ADD] POST `/otter/menu-sync` (authenticated) as a manual/fallback trigger for a restaurant's connected Otter store, alongside the existing webhook trigger (TAB-428)
- [ADD] `acquireAdvisoryLock` (`src/utils/advisoryLock.ts`): serializes concurrent Otter menu syncs for the same store via a Postgres advisory lock, closing the known pg-boss singleton-key dedup race documented in `Documentation/MENU_SYNC.md` — Otter only, Checkmate's job processing is unchanged (TAB-428)
- [UPDATE] widen `locationID` to `number | null` across the shared menu-sync pipeline (`MenuSyncProcessor`, `enrichOperation`, `menuDetailsService`, `AddMenuCommand`, `SortMenusCommand`) so platforms that don't identify restaurants via `restaurants.location_id` (i.e. Otter) can sync without a spurious lookup failure; Checkmate call sites are unaffected (TAB-428)
- [ADD] unit tests for `normalizeOtterMenus`, the shared diff pipeline (`diff → commandFactory → orderCommands`, first-ever coverage), `acquireAdvisoryLock`, and the Otter webhook/manual-trigger/job-processing paths (TAB-428)
- [ADD] scheduled fallback for Otter menu sync: an hourly pg-boss cron job (`QUEUES.OTTER_MENU_SYNC_SCAN`) enumerates every connected Otter store and enqueues a sync for each, so a dropped/delayed webhook self-heals without a manual resync (TAB-428)
- [ADD] `PlatformIntegrationModel`/`Service.getAllConnectedPlatformIntegrations(platform)`: lists all restaurant-scoped integrations for a platform, excluding app-level rows (e.g. Otter's client-credentials token) (TAB-428)
- [UPDATE] `/otter/webhook` now routes by event type: only `menus.*` events (`isOtterMenuUpdateEvent`) trigger a menu sync; order events (`orders.*`), infra/meta events (`ping`, `callback.error.write`), and the legacy `stores.upsert` event are acknowledged and ignored. A missing/malformed `eventType` is logged and ignored rather than thrown (TAB-426)
- [ADD] unit tests for `isOtterMenuUpdateEvent` and the webhook event-routing paths (menu-update vs. order vs. malformed payloads) (TAB-426)
- [ADD] `Documentation/OTTER_FIELD_MAPPING.md`: field-by-field reference mapping Otter's menu model to TapTab's (menu/section/item/modifier-group/modifier levels), flagging fields with no equivalent on either side for a product decision (TAB-427, docs only — no code changes)

### DATABASE
- Database patch `patch-v0-104.sql`: `public.restaurant_groups`, `public.brands` (UUID primary keys), `public.restaurants.brand_id` (nullable UUID FK) (TAB-383)
- Database patch `patch-v0-95.sql`: `public.fonts` allowlist table (seeded), `public.restaurant_typography` (`fonts` + `colors` jsonb) for per-restaurant design settings (TAB-360)

## [Version v2.10.3](https://github.com/taptabapp/super-backend/releases/tag/v2.10.3)
### Changes
- [ADD] create discovery content endpoint [#850](https://github.com/taptabapp/super-backend/pull/850)
- [ADD] get discovery content endpoint [#864](https://github.com/taptabapp/super-backend/pull/864)
- [ADD] when an image logo has a transparent background its filled in automatically in black [#874](https://github.com/taptabapp/super-backend/pull/874)
- [ADD] fix geocoder provider call by providing user agent header [#879](https://github.com/taptabapp/super-backend/pull/879)
- [ADD] edit discovery content endpoint [#867](https://github.com/taptabapp/super-backend/pull/867)

## [Version v2.10.2](https://github.com/taptabapp/super-backend/releases/tag/v2.10.2)
### Changes
- [ADD] Generate Back up menus [#882](https://github.com/taptabapp/super-backend/pull/882)

### DATABASE

## [Version v2.10.1](https://github.com/taptabapp/super-backend/releases/tag/v2.10.1)
### Changes
- [UPDATE] Revert geocoder fix on null latitude and longitude for creating restaurants (allow for null values for lat and long) [#871](https://github.com/taptabapp/super-backend/pull/871)

### DATABASE

## [Version v2.10.0](https://github.com/taptabapp/super-backend/releases/tag/v2.10.0)
### Changes
- [UPDATE] Improve pdf/docx download error messaging [#836](https://github.com/taptabapp/super-backend/pull/836)
- [ADD] create endpoint that generates the signed url for video uploads [#845](https://github.com/taptabapp/super-backend/pull/845)
- [ADD] Endpoint to hide discovery content [#846](https://github.com/taptabapp/super-backend/pull/846)
- [ADD] Endpoint to soft delete discovery content [#847](https://github.com/taptabapp/super-backend/pull/847)
- [ADD] create endpoint to handle linking long form video to media library [#848](https://github.com/taptabapp/super-backend/pull/848)
- [UPDATE] return Restaurant Profile Pages in GET Restaurant Details Response [#844](https://github.com/taptabapp/super-backend/pull/844)
- [ADD] create endpoint to get profile page details
[#849](https://github.com/taptabapp/super-backend/pull/849)
- [UPDATE] Modified create and edit restaurant response for failed geocoder [#858](https://github.com/taptabapp/super-backend/pull/858)
- [ADD] Endpoint to allow users to assign photos to profile section cards [#754](https://github.com/taptabapp/super-backend/pull/857)
- [UPDATE] Get profile pages integration test fix [#860](https://github.com/taptabapp/super-backend/pull/860)
- [FIX] Issue with upserting profile page [#865](https://github.com/taptabapp/super-backend/pull/865)

### DATABASE

## [Version v2.9.2](https://github.com/taptabapp/super-backend/releases/tag/v2.9.2)
### Changes
- [REFACTOR] retain original file name of both image and video for media library [#833](https://github.com/taptabapp/super-backend/pull/833)

### DATABASE

## [Version v2.9.1](https://github.com/taptabapp/super-backend/releases/tag/v2.9.1)
### Changes
- [UPDATE] remove number of images constraint on media image upload endpoint [#829](https://github.com/taptabapp/super-backend/pull/829)
- [ADD] delete profile section endpoint [#797](https://github.com/taptabapp/super-backend/pull/797)

### DATABASE

## [Version v2.9.0](https://github.com/taptabapp/super-backend/releases/tag/v2.9.0)
### Changes
- [ADD] Get Media for restaurant endpoint [#803](https://github.com/taptabapp/super-backend/pull/803)
- [ADD] Upload Media Video Endpoint [#816](https://github.com/taptabapp/super-backend/pull/816)
- [ADD] Add GCP Error reporting using Winston Logger [#745](https://github.com/taptabapp/super-backend/pull/818)
- [ADD] delete media endpoint from media library [#817](https://github.com/taptabapp/super-backend/pull/817)
- [ADD] Link announcement and media endpoint [#815](https://github.com/taptabapp/super-backend/pull/815)
- [UPDATE] updated menu item media returned in get menu details [#820](https://github.com/taptabapp/super-backend/pull/820)
- [UPDATE] Update Announcement Images returned in Get Announcements Response [#821](https://github.com/taptabapp/super-backend/pull/821)
- [ADD] menu item media linkage endpoint [#819](https://github.com/taptabapp/super-backend/pull/819)
- [UPDATE] fix handling of deleting media that has dependencies [#824](https://github.com/taptabapp/super-backend/pull/824)
- [FIX] bug fix optional chaining on menuItem media linking [#825](https://github.com/taptabapp/super-backend/pull/825)

### DATABASE

## [Version v2.8.1](https://github.com/taptabapp/super-backend/releases/tag/v2.8.1)

### Changes
- [UPDATE] Fix prix edge case with prices, as well as prix styling order with multiple sizes for pdfs and docx [#806](https://github.com/taptabapp/super-backend/pull/806)

### DATABASE

## [Version v2.8.0](https://github.com/taptabapp/super-backend/releases/tag/v2.8.0)

### Changes
- [ADD] Upload Restaurant Profile Sections Media endpoint [#765](https://github.com/taptabapp/super-backend/pull/765)
- [ADD] Edit Profile Section Endpoint [#767](https://github.com/taptabapp/super-backend/pull/767)
- [ADD] create profile section card endpoint [#768](https://github.com/taptabapp/super-backend/pull/768)
- [ADD] edit profile section card endpoint [#778](https://github.com/taptabapp/super-backend/pull/778)
- [ADD] delete profile section card endpoint [#769](https://github.com/taptabapp/super-backend/pull/769)
- [REFACTOR] remove 409 constraints on menu items drink items menu sections menus and modifier groups so that there can be duplicates [#781](https://github.com/taptabapp/super-backend/pull/781)
- [REFACTOR] deprecate customizations sides additions when replaced with modifiers [#780](https://github.com/taptabapp/super-backend/pull/780)
- [UPDATE] Menu Item Calories functionality for Create Menu Item Endpoint [#794](https://github.com/taptabapp/super-backend/pull/794)
- [UPDATE] Menu Item Calories functionality for Edit Menu Item Endpoint [#795](https://github.com/taptabapp/super-backend/pull/795)
- [UPDATE] Add calories to menu item in response of Get Menu Details Endpoint [#796](https://github.com/taptabapp/super-backend/pull/796)
- [ADD] Create an endpoint to generate a pdf / word doc file of a menu [#798](https://github.com/taptabapp/super-backend/pull/798)

### DATABASE

## [Version v2.7.0)](https://github.com/taptabapp/super-backend/releases/tag/v2.7.0)

### Changes
- [ADD] Create profile page endpoint [#666](https://github.com/taptabapp/super-backend/pull/666)
- [ADD] Edit profile page endpoint [#675](https://github.com/taptabapp/super-backend/pull/675)
- [ADD] Upload image media endpoint [#756](https://github.com/taptabapp/super-backend/pull/756)
- [ADD] Create profile section endpoint [#766](https://github.com/taptabapp/super-backend/pull/766)
- [ADD] Return modifiers in alphabetical order in GET /modifiers endpoint [#774](https://github.com/taptabapp/super-backend/pull/774)
- [FIX] bug fix return modifiers by list order get menu details [#775](https://github.com/taptabapp/super-backend/pull/775)

### DATABASE

## [Version v2.6.0](https://github.com/taptabapp/super-backend/releases/tag/v2.6.0)

### Changes
- [FIX] case insensitive emails for Log In [#711](https://github.com/taptabapp/super-backend/pull/711)
- [ADD] create modifier endpoint [#728](https://github.com/taptabapp/super-backend/pull/728)
- [ADD] edit modifier endpoint [#729](https://github.com/taptabapp/super-backend/pull/729)
- [ADD] create modifier group endpoint [#727](https://github.com/taptabapp/super-backend/pull/727)
- [ADD] edit modifier group endpoint [#730](https://github.com/taptabapp/super-backend/pull/730)
- [ADD] links modifiers to modifier group endpoint [#732](https://github.com/taptabapp/super-backend/pull/732)
- [DELETE] Remove github action for building and testing on push trigger [#736](https://github.com/taptabapp/super-backend/pull/736)
- [ADD] get modifiers endpoint [#731](https://github.com/taptabapp/super-backend/pull/731)
- [FIX] Ensure Logger is initialized prior to starting app listener [#738](https://github.com/taptabapp/super-backend/pull/738)
- [ADD] delete modifier groups endpoint [#733](https://github.com/taptabapp/super-backend/pull/733)
- [ADD] links modifier groups to menu item endpoint [#734](https://github.com/taptabapp/super-backend/pull/734)
- [ADD] get modifierGroups endpoint [#739](https://github.com/taptabapp/super-backend/pull/739)
- [ADD] add modifier groups and modifiers to get menu details [#740](https://github.com/taptabapp/super-backend/pull/740)
- [ADD] delete modifier endpoint [#741](https://github.com/taptabapp/super-backend/pull/741)
- [FIX] Creating modifier group that has modifier with image [#742](https://github.com/taptabapp/super-backend/pull/742)
- [FIX] Query for restaurant causes timeout due to too many joins [#743](https://github.com/taptabapp/super-backend/pull/743)

### DATABASE
- patch 67 and 68 added for modifiers, modifier groups, modifier media and the sides/additions/customizations migration

## [Version v2.5.1](https://github.com/taptabapp/super-backend/releases/tag/v2.5.1)

### Changes
- [UPDATE] fix customization options lumping into multiple customizations and increase customization limit [#704](https://github.com/taptabapp/super-backend/pull/704)

### DATABASE
- patch 63 added for refresh token

## [Version v2.5.0](https://github.com/taptabapp/super-backend/releases/tag/v2.5.0)

### Changes
- [UPDATE] updated get titles endpoint to use TypeORM [#687](https://github.com/taptabapp/super-backend/pull/687)
- [UPDATE] update manager models file to use typeOrm instead of sql [#690](https://github.com/taptabapp/super-backend/pull/690)
- [UPDATE] updated Edit Announcements to allow for type change [#697](https://github.com/taptabapp/super-backend/pull/697)
- [UPDATE] Updated service tests for dietaryRestrictions and tags to check returned response [#698](https://github.com/taptabapp/super-backend/pull/698)
- [ADD] Get restaurant submitted user emails endpoint [#699](https://github.com/taptabapp/super-backend/pull/699)
- [FIX] bug fix avoid grabbing deleted gallery images [#700](https://github.com/taptabapp/super-backend/pull/700)
- [FIX] bug fix handle gallery image response for list order array edge case [#701](https://github.com/taptabapp/super-backend/pull/701)

### DATABASE

## [Version v2.4.0](https://github.com/taptabapp/super-backend/releases/tag/v2.4.0)

### Changes
- [UPDATE] create manager password must have regex check [#665](https://github.com/taptabapp/super-backend/pull/665)
- [UPDATE] added 404 response when menu layout id doesn't exist [669](https://github.com/taptabapp/super-backend/pull/669)
- [UPDATE] update upload restaurant images endpoint for restaurant profile [#673](https://github.com/taptabapp/super-backend/pull/673)
- [UPDATE] add helper function passwordIsValid to endpoint POST/resetPassword [#684](https://github.com/taptabapp/super-backend/pull/684)
- [UPDATE] add email submission flag functionality to create announcement endpoint [#683](https://github.com/taptabapp/super-backend/pull/683)
- [ADD] get restaurant details endpoint add restaurant images and gallery images in response [#678](https://github.com/taptabapp/super-backend/pull/678)
- [UPDATE] add email submission flag functionality to edit announcement endpoint [#685](https://github.com/taptabapp/super-backend/pull/685)
- [UPDATE] add email submission flag to get announcements response [#686](https://github.com/taptabapp/super-backend/pull/686)
- [DELETE] clean up get restaurants response [#679](https://github.com/taptabapp/super-backend/pull/679)

### DATABASE
- added db patch 60 (restaurant images, albums, and media library)
- added db patch 61 (add email submission to announcements table)
- create new .env variable MAX_RESTAURANT_GALLERY_IMAGES_VALUE
- create new .env variable MAX_RESTAURANT_PROFILE_IMAGES_VALUE

## [Version v2.3.0](https://github.com/taptabapp/super-backend/releases/tag/v2.3.0)

### Changes
- [ADD] add restaurant hours to create restaurant endpoint [#657](https://github.com/taptabapp/super-backend/pull/657)
- [ADD] add restaurant hours to edit restaurant endpoint [#659](https://github.com/taptabapp/super-backend/pull/659)
- [ADD] add restaurant hours to get restaurants response [#660](https://github.com/taptabapp/super-backend/pull/660)
- [ADD] add reservation online ordering links to restaurant endpoint [#661](https://github.com/taptabapp/super-backend/pull/661)
- [ADD] return reservation ordering links in get restaurant details [#662](https://github.com/taptabapp/super-backend/pull/662)
- [FIX] bug fix availabilityNotes edit restaurant not updating if no other restaurant keys passed in [#664](https://github.com/taptabapp/super-backend/pull/664)

### DATABASE
- added db patch 58 (restaurant_hours table)
- added db patch 59 (reservation and ordering links table)

## [Version v2.2.0](https://github.com/taptabapp/super-backend/releases/tag/v2.2.0)

### Changes
- [ADD] add restaurant socials to create restaurant endpoint [#634](https://github.com/taptabapp/super-backend/pull/634)
- [ADD] add restaurant socials to edit restaurant endpoint  [#635](https://github.com/taptabapp/super-backend/pull/635)
- [ADD] update get restaurants endpoint to return restaurant socials [#637](https://github.com/taptabapp/super-backend/pull/637)
- [DELETE] Removed CI pipelines for linode [PR#638](https://github.com/taptabapp/WebMenus/pull/638)

### DATABASE
- added database patch 57 (restaurant_socials table)

## [Version v2.1.0](https://github.com/taptabapp/super-backend/releases/tag/v2.1.0)

### Changes
- [ADD] create hide and show menu endpoint [#620](https://github.com/taptabapp/super-backend/pull/620)
- [ADD] update get menus to return hidden values for menus and menu sections [#621](https://github.com/taptabapp/super-backend/pull/621)
- [ADD] create hide and show menu section endpoint [#622](https://github.com/taptabapp/super-backend/pull/622)
- [ADD] update get restaurant to return hidden values for menus [#623](https://github.com/taptabapp/super-backend/pull/623)
- [ADD] add is hidden to create menu request body  [#624](https://github.com/taptabapp/super-backend/pull/624)

### DATABASE

## [Version v2.0.0](https://github.com/taptabapp/super-backend/releases/tag/v2.0.0)

### Changes
- [ADD] remove deprecated endpoints delete menu item image and post menu item image [#586](https://github.com/taptabapp/super-backend/pull/586)
- [ADD] refactor upload image endpoint to grab videos to be included in list order [#593](https://github.com/taptabapp/super-backend/pull/593)
- [ADD] use Transcode API to convert videos [#599](https://github.com/taptabapp/super-backend/pull/599)
- [ADD] GET menu details to return videos with menu item images [#601](https://github.com/taptabapp/super-backend/pull/601)
- [ADD] set multer file size limit as an .env variable [#608](https://github.com/taptabapp/super-backend/pull/608)
- [ADD] update env sample with multer max file size limit [#609](https://github.com/taptabapp/super-backend/pull/609)
- [UPDATE] retain original video extension with video upload [#616](https://github.com/taptabapp/super-backend/pull/616)
- [UPDATE] fix multiple undeleted thumbnail bug [#618](https://github.com/taptabapp/super-backend/pull/618)
- [UPDATE] include quicktime mimetype with video upload [#619](https://github.com/taptabapp/super-backend/pull/619)


### DATABASE

## [Version v1.1.0](https://github.com/taptabapp/super-backend/releases/tag/v1.1.0)

### Changes
- [DELETE] remove sharps mozjpeg quality resizing of 70 for image uploading [#606](https://github.com/taptabapp/super-backend/pull/606)


### DATABASE

## [Version v1.0.10](https://github.com/taptabapp/super-backend/releases/tag/v1.0.10)

### Changes
- [ADD] upload menu item multiple images [#581](https://github.com/taptabapp/super-backend/pull/581)
- [UPDATE] GET menu details to return multiple menu item images [#581](https://github.com/taptabapp/super-backend/pull/581)
- [ADD] add max number of images .env variable
- [UPDATE] improve multer error handling [#591](https://github.com/taptabapp/super-backend/pull/591)


### DATABASE

## [Version v1.0.9](https://github.com/taptabapp/super-backend/releases/tag/v1.0.9)

### Changes
- [REFACTOR] Remove constraint of requiring menu sections when creating menus [#565](https://github.com/taptabapp/super-backend/pull/565)
- [UPDATE] update create announcement for embedded announcements [#556](https://github.com/taptabapp/super-backend/pull/556)
- [UPDATE] refactor edit announcement endpoints for active status calculation [#566](https://github.com/taptabapp/super-backend/pull/566)
- [UPDATE] refactor hide show announcements endpoints for active status calculation [#570](https://github.com/taptabapp/super-backend/pull/570)
- [UPDATE] update create announcement for drawer announcements [#571](https://github.com/taptabapp/super-backend/pull/571)
- [UPDATE] update edit / hide announcements endpoints to handle drawer [#575](https://github.com/taptabapp/super-backend/pull/575)
- [UPDATE] add name of conflicting announcement to error logs exception message [#578](https://github.com/taptabapp/super-backend/pull/578)


### DATABASE

## [Version v1.0.8](https://github.com/taptabapp/super-backend/releases/tag/v1.0.8)

### Notes
- New environment variable `CORS_ORIGIN` added in PR[#548](https://github.com/taptabapp/super-backend/pull/548)

### Changes
- [ADD] Create Announcement Endpoint [#539](https://github.com/taptabapp/super-backend/pull/539)
- [UPDATE] Fixed environment usage in Makefile [#541](https://github.com/taptabapp/super-backend/pull/541)
- [UPDATE] Added option to run integration tests using a local DB [#545](https://github.com/taptabapp/super-backend/pull/545)
- [ADD] Moved CORS origin domain to env variable [#548](https://github.com/taptabapp/super-backend/pull/548)
- [ADD] Added Cloud Logging [#547](https://github.com/taptabapp/super-backend/pull/547)
- [ADD] Edit Announcement Endpoint [#540](https://github.com/taptabapp/super-backend/pull/540)
- [ADD] Show/Hide Announcement Endpoint [#544](https://github.com/taptabapp/super-backend/pull/544)
- [ADD] Delete Announcement Endpoint [#542](https://github.com/taptabapp/super-backend/pull/542)
- [ADD] Upload Announcement Image Endpoint [#549](https://github.com/taptabapp/super-backend/pull/549)
- [ADD] Get Announcements Endpoint [#550](https://github.com/taptabapp/super-backend/pull/550)
- [UPDATE] update get announcements for embedded announcements [#555](https://github.com/taptabapp/super-backend/pull/555)

### DATABASE

## [Version v1.0.7](https://github.com/taptabapp/super-backend/releases/tag/v1.0.7)
### Changes
- [ADD] Dockerized and adapted app for GCP deployment [#411](https://github.com/taptabapp/super-backend/pull/411).
- [ADD] Integration tests fixes gcp image upload [#525](https://github.com/taptabapp/super-backend/pull/525).
- [ADD] Added GCP Image upload [#515](https://github.com/taptabapp/super-backend/pull/515).
- [ADD] Add 'message' column to menu_sections table [#517](https://github.com/taptabapp/super-backend/pull/517).
- [ADD] set up stripe webhooks for subscription events [#494](https://github.com/taptabapp/super-backend/pull/494)
- [ADD] add menu section message functionality to create menu endpoint and create menu section endpoint [#520](https://github.com/taptabapp/super-backend/pull/520)
- [ADD] add message functionality to edit menu section endpoint [#521](https://github.com/taptabapp/super-backend/pull/521)
- [ADD] add message functionality to get menu details endpoint [#523](https://github.com/taptabapp/super-backend/pull/523)
- [UPDATE] Refactored database scripts to fetch from Database repo docker image [#460](https://github.com/taptabapp/super-backend/pull/460)
- [UPDATE] order restaurant names by alphabetical order for GET restaurants response [#527](https://github.com/taptabapp/super-backend/pull/527)

### DATABASE
- DB patch patch-v0-47.sql added (added message column to menu_sections db table)

## [Version v1.0.6](https://github.com/taptabapp/super-backend/releases/tag/v1.0.6)
### Changes
- [ADD] Database patch for account signup onboarding (updates manager columns and position titles) [#359](https://github.com/taptabapp/super-backend/pull/359).
- [ADD] create manager account restaurant onboarding signup endpoint [#360](https://github.com/taptabapp/super-backend/pull/360).
- [ADD] create verify manager endpoint for profile restaurant onboarding [#363](https://github.com/taptabapp/super-backend/pull/363).
- [ADD] resend onboarding account email endpoint [#366](https://github.com/taptabapp/super-backend/pull/366).
- [ADD] Create Custom Tag Endpoint [#352](https://github.com/taptabapp/super-backend/pull/352).
- [ADD] ignore unverified users for login [#380](https://github.com/taptabapp/super-backend/pull/380).
- [ADD] get user info endpoint [#384](https://github.com/taptabapp/super-backend/pull/384).
- [ADD] Get Cuisines Endpoint [#388](https://github.com/taptabapp/super-backend/pull/388).
- [UPDATE] Refactor GET tags endpoint to get tags based on restaurant id [364](https://github.com/taptabapp/super-backend/pull/364).
- [ADD] create restaurant addresses table [#389](https://github.com/taptabapp/super-backend/pull/389).
- [ADD] create restaurant images table [#390](https://github.com/taptabapp/super-backend/pull/390).
- [UPDATE] Add restaurant validation to endpoint linking tag to menu item [#392](https://github.com/taptabapp/super-backend/pull/392).
- [ADD] create restaurant endpoint [#391](https://github.com/taptabapp/super-backend/pull/391).
- [REFACTOR] Remove Auth validation from get titles endpoint [#403](https://github.com/taptabapp/super-backend/pull/403).
- [ADD] Upload Restaurant Images Endpoint [#393](https://github.com/taptabapp/super-backend/pull/393).
- [ADD] Edit user info endpoint [#404](https://github.com/taptabapp/super-backend/pull/404)
- [UPDATE] Add restaurant basic info to get restaurants response [#400](https://github.com/taptabapp/super-backend/pull/400).
- [ADD] Edit Restaurant endpoint [#401](https://github.com/taptabapp/super-backend/pull/401)
- [ADD] permissions database schema [#441](https://github.com/taptabapp/super-backend/pull/441)
- [ADD] packages for beta and grandfather package mvp for both new and current restaurants users [#442](https://github.com/taptabapp/super-backend/pull/442)
- [ADD] database schema for stripe checkout [#464](https://github.com/taptabapp/super-backend/pull/464)
- [UPDATE] Cleaned up environment variables [#422](https://github.com/taptabapp/super-backend/pull/422)
- [UPDATE] Updated CI ubuntu version to latest [#412](https://github.com/taptabapp/super-backend/pull/412)
- [UPDATE] hot fix on manager_in_roles query patch 43  [#474](https://github.com/taptabapp/super-backend/pull/474)
- [UPDATE] hot fix on patches 37 and 40  [#477](https://github.com/taptabapp/super-backend/pull/477)
- [UPDATE] add on delete cascades to database tables when restaurant is hard deleted [#476](https://github.com/taptabapp/super-backend/pull/476)
- [ADD] assign purchased package to restaurant endpoint [#444](https://github.com/taptabapp/super-backend/pull/444)
- [ADD] Handle Stripe Webhooks for Checkout Session Completion Events [#478](https://github.com/taptabapp/super-backend/pull/478)
- [ADD] Handle Stripe Webhooks for Customer Updated Events [#483](https://github.com/taptabapp/super-backend/pull/483)
- [ADD] create stripe checkout session per customer [#479](https://github.com/taptabapp/super-backend/pull/479)
- [REFACTOR] Remove Auth validation from get cuisines and get menu layouts endpoints [#491](https://github.com/taptabapp/super-backend/pull/491)
- [UPDATE] Link Restaurant Package to Subscription Item [#488](https://github.com/taptabapp/super-backend/pull/488)
- [ADD] Get Stripe customer portal endpoint [#493](https://github.com/taptabapp/super-backend/pull/493)
- [UPDATE] Update Stripe Customer when Customer Info is Updated [489](https://github.com/taptabapp/super-backend/pull/489)
- [ADD] get endpoint for retrieving stripe session via sessionID [#481](https://github.com/taptabapp/super-backend/pull/481)
- [UPDATE] Add functionality to handle stripe customer id when signing up users [#495](https://github.com/taptabapp/super-backend/pull/495)
- [FIX] Fix manager package insert functionality [#501](https://github.com/taptabapp/super-backend/pull/501)
- [FIX] Update Success URL to handle purchase of Subscription [#502](https://github.com/taptabapp/super-backend/pull/502)
- [REFACTOR] remove authorization middleware from manager routes and add parseTokenMiddle to create manager and update password [#500](https://github.com/taptabapp/super-backend/pull/500)
- [REFACTOR] hot fix -> change stripe line item ids to stripe subscription item ids written to subscription item table [#504](https://github.com/taptabapp/super-backend/pull/504)
- [REFACTOR] hot fix stripe subscription items remove 404 not found check and grab subscription items instead of line items when retrieving stripe checkout session [#505](https://github.com/taptabapp/super-backend/pull/505)
- [FIX] hot fix edit restaurant endpoint remove min length for description field [#506](https://github.com/taptabapp/super-backend/pull/506)

### DATABASE
- DB patch patch-v0-37.sql added (added position title types and also email_code and verified_at to managers table)
- DB patch patch-v0-38.sql added (added restaurant_id to tags table)
- DB patch patch-v0-39.sql added (added restaurant_addresses and countries database tables)
- DB patch patch-v0-40.sql added (added restaurant_images and restaurant_image_types database tables, lat and long can be null in restaurants table)
- DB patch patch-v0-41.sql added (drop null constraints for address info in restaurants table and fix EURO currency in countries table)
- DB patch patch-v0-42.sql added (added package and permission tables, triggers for creation of restaurants, admin roles, manager in roles, and role permissions)
- DB patch patch-v0-43.sql added (added beta and grandfather packages with permissions for beta package only, add manager in roles and admin roles for existing prod users, tie grandfather package to restaurant)
- DB patch patch-v0-44.sql added (added Stripe subscriptions, prices, products tables)
- DB patch patch-v0-45.sql added (integration tests fix via on delete cascades for roles, manager_in_roles, role_permisisons, and restaurant_packages)
- add TAP_MANAGER_URL .env variable

## [Version v1.0.5](https://github.com/taptabapp/super-backend/releases/tag/v1.0.5)

### Changes
- [ADD] Get Drink Items Endpoint [#343](https://github.com/taptabapp/super-backend/pull/343).
- [ADD] Menu Item Pair Endpoint [#344](https://github.com/taptabapp/super-backend/pull/344).
- [ADD] Add Menu Item Pairings to Get Menu Details Response [#346](https://github.com/taptabapp/super-backend/pull/346).
- [FIX] Menu Item List Order in Test data [#346](https://github.com/taptabapp/super-backend/pull/346).

### DATABASE
- DB patch patch-v0-36.sql added (fix test data)

## [Version v1.0.4](https://github.com/taptabapp/super-backend/releases/tag/v1.0.4)

### Changes
- [ADD] add bottom menu disclaimer enum with database patch [#331](https://github.com/taptabapp/super-backend/pull/331).
- [ADD] write integration tests for login endpoint [#233](https://github.com/taptabapp/super-backend/pull/233).
- [ADD] create menu endpoint needs to add in functionality for bottom menu disclaimer [#335](https://github.com/taptabapp/super-backend/pull/335).
- [ADD] get menus to return menu disclaimers for both top and bottom locations [#339](https://github.com/taptabapp/super-backend/pull/339).
- [ADD] edit menu endpoint needs to allow for bottom menu disclaimer [#336](https://github.com/taptabapp/super-backend/pull/336).
- [UPDATE] update GET endpoints, dietary restrictions, additions and side dishes, to send back response in alphabetical order [#345](https://github.com/taptabapp/super-backend/pull/345)

### DATABASE
- added database patch 35 (add bottom menu disclaimer enum type menu_message_location to menu_messages_types table)

## [Version v1.0.3](https://github.com/taptabapp/super-backend/releases/tag/v1.0.3)

### Changes
- [ADD] add images and color to restrictions table [#277](https://github.com/taptabapp/super-backend/pull/277).
- [UPDATE] Add isPrixFixe boolean to response of GET restaurants endpoint [#292](https://github.com/taptabapp/super-backend/pull/292).
- [ADD] create tables needed for menu layout functionality [#293](https://github.com/taptabapp/super-backend/pull/293).
- [ADD] endpoint to update restaurant menu layout [#294](https://github.com/taptabapp/super-backend/pull/294).
- [ADD] get menu layouts endpoint [#295](https://github.com/taptabapp/super-backend/pull/295).
- [UPDATE] get restaurants to include menu layout for restaurants [#296](https://github.com/taptabapp/super-backend/pull/296).
- [ADD] add tag colors to tags database table [#304](https://github.com/taptabapp/super-backend/pull/304).
- [ADD] add menu layouts grid with text dark and column with text dark to menu_layouts table [#306](https://github.com/taptabapp/super-backend/pull/306).
- [ADD] PUT menuItem (editMenuItem) needs to include menuSection [#302](https://github.com/taptabapp/super-backend/pull/302).
- [ADD] increase menu disclaimer max length to 1000 characters for create and edit endpoints [#314](https://github.com/taptabapp/super-backend/pull/314).
- [ADD] add database patch Gluten Free Available for dish characteristics [#317](https://github.com/taptabapp/super-backend/pull/317).
- [UPDATE] set min character limits on dto string fields [#319](https://github.com/taptabapp/super-backend/pull/319).
- [ADD] add restaurant user email database table [#322](https://github.com/taptabapp/super-backend/pull/322).

### DATABASE
- added database patch 29 (dish characteristics AKA dietary_restrictions -> colors, image_url, icon_url, new characteristics)
- added database patch 30 (menu_layout table, restaurant_menu_layout table, trigger to set menu layout upon restaurant creation, set exiting restaurants' menu layouts)
- added database patch 31 (colors to recommended menu item tags)
- added database patch 32 (add menu layouts 'grid with text dark' and 'column with text dark')
- added database patch 33 (add 'Gluten Free Available' in database restrictions table)
- added database patch 34 (add "restaurant_user_emails" table in database)

## [Version v1.0.2](https://github.com/taptabapp/super-backend/releases/tag/v1.0.2)

### Changes
- [ADD] middleware super user authentication [#255](https://github.com/taptabapp/super-backend/pull/255).
- [ADD] GET restaurants super user authentication [#257](https://github.com/taptabapp/super-backend/pull/257).
- [ADD] refactor create manager endpoint to only allow super users to have access [#258](https://github.com/taptabapp/super-backend/pull/258).
- [UPDATE] return menu sections on GET restaurants endpoint [#271](https://github.com/taptabapp/super-backend/pull/271).
- [ADD] created database patch for recommended tags table [#259](https://github.com/taptabapp/super-backend/pull/259).
- [UPDATE] shrink image upload max size down to 750KB [#274](https://github.com/taptabapp/super-backend/pull/274).
- [ADD] get all tags endpoint [#273](https://github.com/taptabapp/super-backend/pull/273).
- [ADD] link menu item to recommended tag [#260](https://github.com/taptabapp/super-backend/pull/260).
- [UPDATE] add tags to response get menus [#263](https://github.com/taptabapp/super-backend/pull/263).


### DATABASE
- added database patch 28 (recommended menu item tags)


## [Version v1.0.1](https://github.com/taptabapp/super-backend/releases/tag/v1.0.1)

### Changes
- [ADD] Add prix fixe boolean to menus table [#192](https://github.com/taptabapp/super-backend/pull/192).
- [ADD] return created date in get side dishes [#232](https://github.com/taptabapp/super-backend/pull/232).
- [ADD] create database patch that adds hidden column [#238](https://github.com/taptabapp/super-backend/pull/238).
- [ADD] hide endpoint for menu items to toggle hide on and off [#239](https://github.com/taptabapp/super-backend/pull/239).
- [ADD] add hide functionality to drink items [#252](https://github.com/taptabapp/super-backend/pull/252).
- [ADD] add isHidden boolean in response of endpoint create menu items [#243](https://github.com/taptabapp/super-backend/pull/243).
- [ADD] GET menu items need hidden field added [#241](https://github.com/taptabapp/super-backend/pull/241).
- [ADD] add prix fixe to create menu endpoint [#240](https://github.com/taptabapp/super-backend/pull/240).
- [ADD] add prix fixe to edit menu endpoint [#245](https://github.com/taptabapp/super-backend/pull/245).
- [ADD] add prix fixe boolean to get menu details endpoint [#244](https://github.com/taptabapp/super-backend/pull/244).
- [ADD] login super user authentication [#254](https://github.com/taptabapp/super-backend/pull/254).

### DATABASE
- added database patch 26 (is_prix_fixe menus)
- added database patch 27 (hide menu items, sections, and menus)

## [Version v1.0.0](https://github.com/taptabapp/super-backend/releases/tag/v1.0.0)

### Changes

- [REFACTOR] Refactor Login to use TypeScript and latest versions [#1](https://github.com/taptabapp/super-backend/pull/1).
- [ADD] Create Additions Endpoint [#2](https://github.com/taptabapp/super-backend/pull/2).
- [UPDATE] Customize validation layer to check nested objects [#3](https://github.com/taptabapp/super-backend/pull/3).
- [ADD] CI Workflow [#6](https://github.com/taptabapp/super-backend/pull/6).
- [ADD] Add CHANGELOG and PR template [#7](https://github.com/taptabapp/super-backend/pull/7).
- [ADD] Add Getting Started Doc on Swagger [#11](https://github.com/taptabapp/super-backend/pull/11).
- [REFACTOR] Refactor Login to use Manager Tables (Add tests and swagger docs) [#9](https://github.com/taptabapp/super-backend/pull/9).
- [ADD] Implement Manager Authorization Layer [#5](https://github.com/taptabapp/super-backend/pull/5).
- [ADD] Delete Additions Endpoint [#13](https://github.com/taptabapp/super-backend/pull/13).
- [ADD] Implemented Integration Testing [#14](https://github.com/taptabapp/super-backend/pull/14).
- [REFACTOR] Revise errors middleware and handling [#30](https://github.com/taptabapp/super-backend/pull/30).
- [ADD] Get Additions Endpoint [#58](https://github.com/taptabapp/super-backend/pull/58).
- [ADD] Create Get /managers/titles Endpoint [#32](https://github.com/taptabapp/super-backend/pull/60)
- [ADD] Create Post /managers Endpoint [#31](https://github.com/taptabapp/super-backend/pull/61)
- [ADD] added db patches up to 17 to super backend [#73](https://github.com/taptabapp/super-backend/pull/73)
- [FIX] Husky pre-commit and prettier auto format [PR#80](https://github.com/taptabapp/super-backend/pull/80).
- [UPDATE] Testing documentation for Jest [PR#81](https://github.com/taptabapp/super-backend/pull/81).
- [ADD] Create Menus Endpoint [#71](https://github.com/taptabapp/super-backend/pull/71).
- [ADD] Delete Menus Endpoint [#74](https://github.com/taptabapp/super-backend/pull/74).
- [ADD] Add database patches 20 and 21 to super backend [#92](https://github.com/taptabapp/super-backend/pull/92).
- [ADD] Implement Create Menu Item Endpoint [#84](https://github.com/taptabapp/super-backend/pull/84).
- [ADD] Implement Create Menu Section Endpoint [#77](https://github.com/taptabapp/super-backend/pull/77).
- [ADD] Implement Delete Menu Section Endpoint [#78](https://github.com/taptabapp/super-backend/pull/78).
- [ADD] Implement Upload Menu Item Image Endpoint [#93](https://github.com/taptabapp/super-backend/pull/93).
- [PATCH] Database patch for setting up deleted columns for soft delete tables [#100](https://github.com/taptabapp/super-backend/pull/100).
- [ADD] Implement Delete Menu Item Endpoint [#101](https://github.com/taptabapp/super-backend/pull/101).
- [ADD] Implement Delete Menu Item Endpoint swagger documents [#120](https://github.com/taptabapp/super-backend/pull/120).
- [REFACTOR] Completed deleted endpoints need to be refactored to use soft delete functionality [#105](https://github.com/taptabapp/super-backend/pull/105).
- [ADD] Implement Read Restaurants Endpoint [#118](https://github.com/taptabapp/super-backend/pull/118).
- [REFACTOR] Break out linking of dietary restrictions and menu item to own endpoint [#124](https://github.com/taptabapp/super-backend/pull/124).
- [ADD] Add menu disclaimers to create menus [#122](https://github.com/taptabapp/super-backend/pull/122).
- [REFACTOR] Break out linking of additions and menu item to own endpoint [#127](https://github.com/taptabapp/super-backend/pull/127).
- [REFACTOR] Break out linking of side dishes and menu item to own endpoint [#129](https://github.com/taptabapp/super-backend/pull/129).
- [REFACTOR] Break out adding customizations to menu item to own endpoint [#130](https://github.com/taptabapp/super-backend/pull/130).
- [REFACTOR] Remove broken out logic from the create menu item endpoint [#131](https://github.com/taptabapp/super-backend/pull/131).
- [ADD] Create a drink item endpoint [#143](https://github.com/taptabapp/super-backend/pull/143).
- [ADD] Implement edit menu item endpoint [#138](https://github.com/taptabapp/super-backend/pull/138).
- [ADD] Edit drink item endpoint [#153](https://github.com/taptabapp/super-backend/pull/153).
- [ADD] Implement edit menu endpoint [#132](https://github.com/taptabapp/super-backend/pull/132).
- [ADD] Create shell script file that runs integration tests in specific execution order [#158](https://github.com/taptabapp/super-backend/pull/158).
- [FIX] Fix no entity column "delete" found in getMenuItemEntityByID [PR#165](https://github.com/taptabapp/super-backend/pull/165).
- [ADD] Implement get menu details by menu id endpoint [#172](https://github.com/taptabapp/super-backend/pull/172).
- [ADD] Implement Create SideDishes Endpoint [#94](https://github.com/taptabapp/super-backend/pull/94).
- [ADD] Implement Get SideDishes Endpoint [#94](https://github.com/taptabapp/super-backend/pull/94).
- [ADD] Implement Delete SideDishes Endpoint [#94](https://github.com/taptabapp/super-backend/pull/94).
- [ADD] Implement edit addition endpoint [#161](https://github.com/taptabapp/super-backend/pull/161).
- [ADD] Implement Edit SideDishes Endpoint [#155](https://github.com/taptabapp/super-backend/pull/155).
- [ADD] Implement Soft Delete Drink Item Endpoint [#159](https://github.com/taptabapp/super-backend/pull/159).
- [FIX] Parse token middleware crash on Unauthorized User [#171](https://github.com/taptabapp/super-backend/pull/171).
- [ADD] Implement edit menu section endpoint [#167](https://github.com/taptabapp/super-backend/pull/167).
- [FIX] Create menu sections gets soft deleted menu sections [#177](https://github.com/taptabapp/super-backend/pull/177).
- [ADD] Add Swagger docs JSON link [#178](https://github.com/taptabapp/super-backend/pull/178).
- [REFACTOR] Refactor Get Additions Endpoint to handle soft delete [PR#179] (https://github.com/taptabapp/super-backend/pull/179).
- [REFACTOR] Refactor Create Additions Endpoint to handle soft delete [PR#179] (https://github.com/taptabapp/super-backend/pull/179).
- [ADD] Implement Get Restrictions Endpoint [#175](https://github.com/taptabapp/super-backend/pull/175).
- [ADD] Implement reorder menu sections endpoint [#168](https://github.com/taptabapp/super-backend/pull/168).
- [ADD] Implement update menu items order [#182](https://github.com/taptabapp/super-backend/pull/182).
- [ADD] Implement reorder menus endpoint [#184](https://github.com/taptabapp/super-backend/pull/184).
- [ADD] Make forget password endpoint [#151](https://github.com/taptabapp/super-backend/pull/151).
- [ADD] Set up set new password [#188](https://github.com/taptabapp/super-backend/pull/188).
- [ADD] Make new endpoint to update manager password [#201](https://github.com/taptabapp/super-backend/pull/201).
- [FIX] 409 Duplicate being thrown for create/edit of menu item with same name in different menu section [#204](https://github.com/taptabapp/super-backend/pull/204).
- [ADD] Remove Menu Item Image Endpoint [#208](https://github.com/taptabapp/super-backend/pull/208).
- [FIX] Get Menu Details returns deleted additions/sides [#193](https://github.com/taptabapp/super-backend/pull/193).
- [FIX] Edit Menu Item ignores soft deletes [#213](https://github.com/taptabapp/super-backend/pull/213).
- [FIX] Disallow duplicate names case sensitive for menu items additions and side dishes [#215](https://github.com/taptabapp/super-backend/pull/215).
- [FIX] Restaurant not being fetched if all of its menus were soft deleted [#218](https://github.com/taptabapp/super-backend/pull/218).
- [FIX] editMenuSection endpoint not handling case insensitive renaming functionality and allowing duplicate menu section names [#197](https://github.com/taptabapp/super-backend/pull/197).
- [FIX] edit menu endpoint allowing duplicate menu names bug [#211](https://github.com/taptabapp/super-backend/pull/211).
- [FIX] Restaurant menus not being ordered correctly [#220](https://github.com/taptabapp/super-backend/pull/220).
- [ADD] add createdAt to response of create menu item [#223](https://github.com/taptabapp/super-backend/pull/223).

### DATABASE
- [REFACTOR] Changed database patch create-v0.sql to fix menu hours primary key > 1000 (via replacing inserted PK values to DEFAULT of menu hours with PK > 1000)  [ZenHub issue #160](https://github.com/taptabapp/super-backend/issues/160)
- [PATCH] Database patch patch-v0.24.sql added for handling list order for soft delete [#141](https://github.com/taptabapp/super-backend/pull/141).


---
# Template
## [Version vX.X.X](https://tagURL)

- [ADD] Sample addition [PR#XXX](https://prURL).
- [DELETE] Sample deletion [PR#XXX](https://prURL).
- [UPDATE] Sample update [PR#XXX](https://prURL).
- [FIX] Sample bug fix change [PR#XXX](https://prURL).
- [REFACTOR] Sample refactoring change [PR#XXX](https://prURL).
---
