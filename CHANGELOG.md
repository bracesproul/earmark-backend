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
Commit ID: [main 11d1d9c](https://github.com/bracesproul/earmark-backend/commit/11d1d9c)

#### Added
- Added /api/earmark/visualize for fetching data to populate charts on the /dashboard/visualize page
    - Added functions for transaction data on line charts, bar charts, and pie charts

### Fixed
- Fixed schema for account data inside firebase access_tokens document

### Changed
- Updated the public_token_exchange to write the institution name to firebase


## [0.0.4] - 2022-06-8

### Notes
Commit ID: [main ](https://github.com/bracesproul/earmark-backend/commit/)

#### Added
- Added /api/earmark/getDynamicTransactions for fetching data to populate dynamic transactions table on the /dashboard/[ins_id] page
- Added exported function to firestore for fetching access token which corresponds to the institution id

### Fixed

### Changed