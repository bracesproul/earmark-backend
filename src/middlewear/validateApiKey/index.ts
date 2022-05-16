const dotenv = require('dotenv').config();

const EARMARK_API_KEY = process.env.EARMARK_API_KEY

const validateApiKey = (req:any, res:any, next:any) => {
    const reqApiKey = req.headers['earmark-api-key'];
    if (reqApiKey !== EARMARK_API_KEY) {
        res.status(401);
        res.json({
            error: "Unauthorized - invalid api key",
            message: "Please provide a valid api key",
            api_key: reqApiKey,
        });
        res.end();
        console.log('invalid key')
        return false;
    }
    next();
    return;
}

module.exports = validateApiKey;