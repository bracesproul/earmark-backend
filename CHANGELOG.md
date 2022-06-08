# Change Log

All notable changes to this project will be documented in this file.


## [0.0.1] - 2022-06-05

### Notes

#### Added
- added /api/earmark/dashboard route for fetching data for the main /dashboard page on frontend
    - spending overview
    - top merchants
    - total spending

### Fixed

### Changed


## [0.0.2] - 2022-06-05

### Notes

#### Added
- Added new api queries to fetch data based off date range supplied by frontend api call

### Fixed

### Changed


## [0.0.3] - 2022-06-07

### Notes
Commit ID: [main 11d1d9c](https://github.com/bracesproul/earmark-backend/commit/11d1d9c)

#### Added
- Added /api/earmark/visualize for fetching data to populate charts on the /dashboard/visualize page
    - Added functions for transaction data on line charts, bar charts, and pie charts

### Fixed
- Fixed schema for account data inside firebase access_tokens document

### Changed
- Updated the public_token_exchange to write the institution name to firebase


## [0.0.4] - 2022-06-08

### Notes
Commit ID: [main db45502](https://github.com/bracesproul/earmark-backend/commit/db45502)

#### Added
- Added /api/earmark/getDynamicTransactions for fetching data to populate dynamic transactions table on the /dashboard/[ins_id] page
- Added exported function to firestore for fetching access token which corresponds to the institution id

### Fixed

### Changed


## [0.0.5] - 2022-06-08

### Notes
Commit ID: [main ](https://github.com/bracesproul/earmark-backend/commit/)

#### Added
- Added [/parseNumbers](https://github.com/bracesproul/earmark-backend/tree/main/src/lib/parseNumbers) to lib as exported function for parsing numbers (take txn amount, turn postive, round to 2 decimal places || add ending 0 if only 1 decimal place)
- Added `negativeNumber` key to response object for [spending overview, top merchants](https://github.com/bracesproul/earmark-backend/blob/main/src/api/earmark/dashboard/index.ts) for frontend to know if number is negative (for table row color)
- Added `id` data point to response object for [spending overview, top merchants](https://github.com/bracesproul/earmark-backend/blob/main/src/api/earmark/dashboard/index.ts)

### Fixed
- Added the [parseNumbers()](https://github.com/bracesproul/earmark-backend/tree/main/src/lib/parseNumbers) method to [getDynamicTransactions](https://github.com/bracesproul/earmark-backend/tree/main/src/api/earmark/getDynamicTransactions) to properly parse transaction amounts

### Changed
- Changed returned amounts for [getDynamicTransactions](https://github.com/bracesproul/earmark-backend/tree/main/src/api/earmark/getDynamicTransactions) to string with `$` prefix
- Changed all files which parse transaction amounts to use [parseNumbers](https://github.com/bracesproul/earmark-backend/tree/main/src/lib/parseNumbers)