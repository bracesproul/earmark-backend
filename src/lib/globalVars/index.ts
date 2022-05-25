/* eslint-disable */
const globalVars = () => {
    let api_url;
    if (process.env.NODE_ENV === 'production') {
        api_url = '184.169.199.251:8080';
    } else {
        api_url = 'http://localhost:8080';
    }
    
    return {
        API_URL: api_url,
    }
}

module.exports = globalVars;