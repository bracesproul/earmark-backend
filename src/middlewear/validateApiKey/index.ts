const dotenv = require('dotenv').config();

const EARMARK_API_KEY = process.env.EARMARK_API_KEY

const validateApiKey = (req:any, res:any, next:any) => {
    const reqApiKey = req.headers['earmark-api-key'];
    if (!EARMARK_API_KEY) {
        res.status(503);
        res.json({
            error: "Server missing earmark-api-key",
            message: "No earmark-api-key found server-side, check enviroment variables.",
            provided_api_key: reqApiKey,
        });
        res.end();
        console.error('server-side error, earmark-api-key not found. provided key from client: ', reqApiKey);
        return false;
    } else if (!reqApiKey) {
        res.status(401);
        res.json({
            error: "Unauthorized - Missing API key",
            message: "Please provide an api key",
            provided_api_key: undefined,
        });
        res.end();
        console.error('missing api key')
        return false;
    } else if (reqApiKey !== EARMARK_API_KEY && reqApiKey) {
        res.status(401);
        res.json({
            error: "Unauthorized - invalid api key",
            message: "Please provide a valid api key",
            provided_api_key: reqApiKey,
        });
        res.end();
        console.error('invalid api key. provided key from client: ', reqApiKey);
        return false;
    }
    next();
    return;
}

module.exports = validateApiKey;