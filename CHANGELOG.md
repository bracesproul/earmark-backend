# Change Log

All notable changes to this project will be documented in this file.


## [0.0.1] - 2022-06-5

### Notes

#### Added
- added /api/earmark/dashboard route for fetching data for the main /dashboard page on frontend
    - spending overview
    - top merchants
    - total spending

### Fixed

### Changed


## [0.0.2] - 2022-06-5

### Notes

#### Added
- Added new api queries to fetch data based off date range supplied by frontend api call

### Fixed

### Changed


## [0.0.3] - 2022-06-7

### Notes

#### Added
- Added /api/earmark/visualize for fetching data to populate charts on the /dashboard/visualize page
    - Added functions for transaction data on line charts, bar charts, and pie charts

### Fixed
- Fixed schema for account data inside firebase access_tokens document

### Changed
- Updated the public_token_exchange to write the institution name to firebase