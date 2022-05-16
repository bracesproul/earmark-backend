export const paramErrorHandling = async (requiredParams: Array<any>, params: any, nextApiUrl: string) => {
    let error = false;
    let errorMessage = '';
    let missingParams: Array<string> = [];
    let jsonErrorMessage = {};
    requiredParams.forEach(param => {
        if (params[param] === 0 && param == "offset") {
            error = false;
            return;
        } if (!params[param]) {
            error = true;
            missingParams.push(param);
        } 
    });
    if (error) {
        errorMessage = `Error: ${missingParams.join(', ')} is/are required`;
        jsonErrorMessage = {
            error: error,
            errorMessage: errorMessage,
            statusCode: 400,
            metaData: {
                missingParams: missingParams,
                requiredParams: requiredParams,
                requestTime: new Date().toLocaleString(),
                nextApiUrl: nextApiUrl,
            }
        }
    }
    return {
        error,
        errorMessage,
        jsonErrorMessage,
    };
};

// Use in api code:
/*
import { paramErrorHandling } from '../../../../lib/Errors/paramErrorHandling'

    // ERROR HANDLING, CHECKS FOR MISSING PARAMS
    const requiredParams = ['<PARAM>', '<PARAM>'];
    const params = {
        <PARAM>: <PARAM>,
        <PARAM>: <PARAM>
    };
    const nextApiUrl = '/api/<API_URL>';
    if ((await paramErrorHandling(requiredParams, params, nextApiUrl)).error) {
        console.error((await paramErrorHandling(requiredParams, params, nextApiUrl)).errorMessage);
        res.status(400);
        res.json((await paramErrorHandling(requiredParams, params, nextApiUrl)).jsonErrorMessage);
        return;
    };
    // END ERROR HANDLING CODE

*/