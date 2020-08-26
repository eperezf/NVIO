const AWS = require('aws-sdk');

// Create the DynamoDB Client with the region you want
const region = 'us-east-1';
const dynamoDbClient = createDynamoDbClient(region);

// Create the input for query call

function sort_comunas(a, b) {
    var comunas = [a, b];
    comunas.sort();
    var comuna1 = comunas[0]
    var comuna2 = comunas[1]
    return [comuna1, comuna2]
}
var a = "Vitacura";
var b = "Providencia";

comunas = sort_comunas(a, b);
var comuna1 = comunas[0];
var comuna2 = comunas[1];

console.log(comuna1, comuna2)
const queryInput = createQueryInput(comuna1, comuna2);

// Call DynamoDB's query API
executeQuery(dynamoDbClient, queryInput).then(() => {
        console.info('Query API call has been executed.')
    }
);

function createDynamoDbClient(regionName) {
    // Set the region
    AWS.config.update({region: regionName});
    // Use the following config instead when using DynamoDB Local
    // AWS.config.update({region: 'localhost', endpoint: 'http://localhost:8000', accessKeyId: 'access_key_id', secretAccessKey: 'secret_access_key'});
    return new AWS.DynamoDB();
}

function createQueryInput(comuna1, comuna2) {
    return {
        "TableName": "NVIO",
        "ScanIndexForward": false,
        "ConsistentRead": false,
        "KeyConditionExpression": "#985c0 = :985c0",
        "FilterExpression": "#985c1 = :985c1 And #985c2 = :985c2",
        "ExpressionAttributeValues": {
            ":985c0": {
                "S": "COMUNA"
            },
            ":985c1": {
                "S": comuna1
            },
            ":985c2": {
                "S": comuna2
            }
        },
        "ExpressionAttributeNames": {
            "#985c0": "PK",
            "#985c1": "comuna1",
            "#985c2": "comuna2"
        }
    }
}

async function executeQuery(dynamoDbClient, queryInput) {
    // Call DynamoDB's query API
    try {
        const queryOutput = await dynamoDbClient.query(queryInput).promise();
        console.info('Query successful.');
        // Handle queryOutput
        var costo = queryOutput.Items[0].costo.N
        console.log(costo)
    } catch (err) {
        handleQueryError(err);
    }
}

// Handles errors during Query execution. Use recommendations in error messages below to
// add error handling specific to your application use-case.
function handleQueryError(err) {
    if (!err) {
        console.error('Encountered error object was empty');
        return;
    }
    if (!err.code) {
        console.error(`An exception occurred, investigate and configure retry strategy. Error: ${JSON.stringify(err)}`);
        return;
    }
    // here are no API specific errors to handle for Query, common DynamoDB API errors are handled below
    handleCommonErrors(err);
}

function handleCommonErrors(err) {
    switch (err.code) {
        case 'InternalServerError':
            console.error(`Internal Server Error, generally safe to retry with exponential back-off. Error: ${err.message}`);
            return;
        case 'ProvisionedThroughputExceededException':
            console.error(`Request rate is too high. If you're using a custom retry strategy make sure to retry with exponential back-off.`
                + `Otherwise consider reducing frequency of requests or increasing provisioned capacity for your table or secondary index. Error: ${err.message}`);
            return;
        case 'ResourceNotFoundException':
            console.error(`One of the tables was not found, verify table exists before retrying. Error: ${err.message}`);
            return;
        case 'ServiceUnavailable':
            console.error(`Had trouble reaching DynamoDB. generally safe to retry with exponential back-off. Error: ${err.message}`);
            return;
        case 'ThrottlingException':
            console.error(`Request denied due to throttling, generally safe to retry with exponential back-off. Error: ${err.message}`);
            return;
        case 'UnrecognizedClientException':
            console.error(`The request signature is incorrect most likely due to an invalid AWS access key ID or secret key, fix before retrying.`
                + `Error: ${err.message}`);
            return;
        case 'ValidationException':
            console.error(`The input fails to satisfy the constraints specified by DynamoDB, `
                + `fix input before retrying. Error: ${err.message}`);
            return;
        case 'RequestLimitExceeded':
            console.error(`Throughput exceeds the current throughput limit for your account, `
                + `increase account level throughput before retrying. Error: ${err.message}`);
            return;
        default:
            console.error(`An exception occurred, investigate and configure retry strategy. Error: ${err.message}`);
            return;
    }
}
