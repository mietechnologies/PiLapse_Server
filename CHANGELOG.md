# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

- Removed some code from the errorController that was specific for another project.

### Changed

- Updated the user model so that it now also returns a list of Pis that are associated with the user.

### Removed
