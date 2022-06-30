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
Commit ID: [main 5847a2f](https://github.com/bracesproul/earmark-backend/commit/5847a2f)

#### Added
- Added [/parseNumbers](https://github.com/bracesproul/earmark-backend/tree/main/src/lib/parseNumbers) to lib as exported function for parsing numbers (take txn amount, turn postive, round to 2 decimal places || add ending 0 if only 1 decimal place)
- Added `negativeNumber` key to response object for [spending overview, top merchants](https://github.com/bracesproul/earmark-backend/blob/main/src/api/earmark/dashboard/index.ts) for frontend to know if number is negative (for table row color)
- Added `id` data point to response object for [spending overview, top merchants](https://github.com/bracesproul/earmark-backend/blob/main/src/api/earmark/dashboard/index.ts)

### Fixed
- Added the [parseNumbers()](https://github.com/bracesproul/earmark-backend/tree/main/src/lib/parseNumbers) method to [getDynamicTransactions](https://github.com/bracesproul/earmark-backend/tree/main/src/api/earmark/getDynamicTransactions) to properly parse transaction amounts

### Changed
- Changed returned amounts for [getDynamicTransactions](https://github.com/bracesproul/earmark-backend/tree/main/src/api/earmark/getDynamicTransactions) to string with `$` prefix
- Changed all files which parse transaction amounts to use [parseNumbers](https://github.com/bracesproul/earmark-backend/tree/main/src/lib/parseNumbers)


## [0.0.6] - 2022-06-08

### Notes
Commit ID: [main da7a075](https://github.com/bracesproul/earmark-backend/commit/da7a075)

#### Added
- Added `fontWeight` data point to response object for [/api/earmark/getDynamicTransactions](https://github.com/bracesproul/earmark-backend/tree/main/src/api/earmark/getDynamicTransactions), value is `bold` if transaction is a negative (credit) or normal if transaction is postive (debit)
- Added accountDetails function to /api/earmark/dashboard route for fetching account details for the /dashboard page

### Fixed

### Changed
- [/getDynamicTransactions](https://github.com/bracesproul/earmark-backend/tree/main/src/api/earmark/getDynamicTransactions) now parses transaction amounts as strings with `$` prefix (accounts for negative numbers)


## [0.0.7] - 2022-06-24

### Notes
Commit ID: [main 3aae147](https://github.com/bracesproul/earmark-backend/commit/3aae147)

#### Added

### Fixed
- Fixed error code response for api key validation

### Changed
- Changed error handling for `earmark-api-key`
    - Check if server-side api key is undefined
    - Check if client request api key is null
    - Check if client request api key != server-side api key && client request api key !null


## [0.0.8] - 2022-06-26

### Notes
Commit ID: [main ca55a07](https://github.com/bracesproul/earmark-backend/commit/ca55a07)

*will add ability to do 1/month, bi-weekly, bi-yearly, custom
**will switch to send over data without checking value (can be any value as long as it's recurring) or custom price range

#### Added
- Added `api/earmark/recurring` route (in `/src/api/earmark/recurring`)
    - Makes call to get all transactions
    - Checks them for transactions which appear, once a month*, within two days from starting charge date, within 10% value**

### Fixed

### Changed


## [0.0.9] - 2022-06-26

### Notes
Commit ID: [main fdea10e](https://github.com/bracesproul/earmark-backend/commit/fdea10e)

#### Added
- Added function in lib for formatting strings, makes all first char upper case, removes speical chars
- Added todo file

### Fixed
- Fixed recurring code to properrly account for what is and what is not a recurring charge
- Fixed some console.log statments to be console.error

### Changed


## [0.0.10] - 2022-06-27

### Notes
Commit ID: [main d799b1e](https://github.com/bracesproul/earmark-backend/commit/d799b1e)

#### Added
- Added `application_start.sh`, `application_stop.sh` and `before_install.sh` shell scripts for ci/cd with aws
- Added `appspec.yml` config file for aws

### Fixed

### Changed
- Added options with `include_optional_metadata` to `/api/plaid/institution/get` and `/api/plaid/institution/get_by_id`
- Moved `ts-node` and `typescript` from devDependencies to dependencies 


## [0.0.11] - 2022-06-29

### Notes
Commit ID: [main ](https://github.com/bracesproul/earmark-backend/commit/)

#### Added

### Fixed

### Changed
- dashboard spending overview response now contains `account_id`

### Removed