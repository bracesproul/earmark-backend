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

module.exports = paramErrorHandling;