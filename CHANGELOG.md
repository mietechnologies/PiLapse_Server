# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added device tokens: registering a Pi returns a long-lived token scoped to that Pi, which can be rotated or revoked (`POST`/`DELETE /pi/:id/token`). Pis authenticate with `Authorization: Device <token>`.
- Added `GET /api/v1/info` so clients can confirm a URL is a PiLapse server and whether it needs its first account.
- Added photo intents: uploads carry an `intent` (the client profile that took them), files are stored per intent, and each Pi records the intents it has used.
- Added `.env.example`, a README, an API test suite (`npm test`), and a GitHub Actions workflow.

- Added a couple middleware solutions at the app entry point, to prevent certain security issues and limit certain unwanted traffic.
- Created a basic model and Mongoose Schema for User.
- Created the class AppError and an errorController to handle internal errors and relay that information to the consumer.
- Made a signup and login route to enable the creation of new users, and the ability for those users to sign in and recieve a JWT.
- Created the protect route, to protect certain endpoints against unauthorized access for non-users.
- Created a handler utility with a couple convenience methods for fetching/finding objects from the DB.
- Created the user controller and an endpoint for the user to get their information.
- Created a basic model and Mongoose Schema for Pi.
- Created the controller and routes for Pi.
- Added a getAll method to the handler utility and created an APIFeatures class to convert a request object into a query.
- Created a getAll route for the Pi resource.
- Created the controller and model for Photos.

### Fixed

- Fixed login and signup failing under Docker Compose because `JWT_SECRET` and `JWT_EXPIRES_IN` were never set; the server now refuses to start without its required settings.
- Fixed error responses never being sent when `NODE_ENV` was unset.
- Fixed Pi and photo routes not checking ownership: users and devices can only reach their own Pis and photos, and `GET /pi/:id/photos` no longer returns every photo in the database.
- Fixed photo filenames colliding when two uploads arrived in the same millisecond.

- Removed some code from the errorController that was specific for another project.

### Changed

- All routes moved under `/api/v1`. `GET /pi/all` (public) is replaced by `GET /pi` (your Pis only), and photo files are fetched by photo id at `/pi/:id/photos/:photoId`.
- The first account becomes the server owner and public signup closes after it; the owner creates further accounts.
- Pi names only need to be unique per user; room, window direction, location and model are optional.
- Rate limiting now applies only to login and signup, so frequent photo uploads aren't blocked.
- JPEG uploads are stored as sent instead of being re-encoded at quality 100.
- Docker: credentials come from `.env` instead of being hardcoded, MongoDB is no longer published on the host, and the app runs as a non-root user with production dependencies only and a health check.

- Updated the user model so that it now also returns a list of Pis that are associated with the user.

### Removed
