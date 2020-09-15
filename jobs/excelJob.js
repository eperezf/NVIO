// excelJob.js
const {Client, Status} = require("@googlemaps/google-maps-services-js");
const aws = require("aws-sdk");
aws.config.update({
  region: process.env.DBREGION,
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET
});
var dynamodbEndpoint = new aws.Endpoint(process.env.AWS_DYNAMODB_ENDPOINT);
var dynamodb = new aws.DynamoDB({endpoint:dynamodbEndpoint});

module.exports = async (job) =>{
  var fromAddress = "";
  var toAddress = "";
  //Check origin address
  if (!job.data.orderData.dir_orig) {
    console.log("JOB "+job.id+" WILL USE DEFAULT ORIGIN ADDRESS. NO NEED TO GEOCODE");
  }
  else {
    console.log("JOB "+job.id+" WILL USE CUSTOM ORIGIN ADDRESS. MUST BE GEOCODED!");
    console.log("GEOCODING");
    job.progress(50);
    fromAddress = await geocode(job.data.orderData.dir_orig + ", " + job.data.orderData.comuna_orig + ", Santiago");
    if (fromAddress.partial_match == true) {
      console.log("PARTIAL ORIGIN MATCH! ERROR!");
      console.log(job.data.orderData.dir_orig + ", " + job.data.orderData.comuna_orig + ", Santiago");
      job.progress(100);
      return Promise.reject(new Error('Origin address '+job.data.orderData.dir_orig + ", " + job.data.orderData.comuna_orig + ", Santiago "+'does not exist'));
    }
  }

  //Check destination address
  toAddress = await geocode(job.data.orderData.dir_dest + ", " + job.data.orderData.comuna_dest + ", Santiago");
  if (toAddress.partial_match == true) {
    console.log("PARTIAL DESTINATION MATCH! ERROR!");
    console.log(job.data.orderData.dir_dest + ", " + job.data.orderData.comuna_dest + ", Santiago");
    job.progress(100);
    return Promise.reject(new Error('Origin address '+job.data.orderData.dir_dest + ", " + job.data.orderData.comuna_dest + ", Santiago "+'does not exist'));
  }

  //Check ID colission
  console.log("Checking colission of order ID " + job.id.substring(6) + " for company " + job.data.companyData.Items[0].PK.S.replace("COMPANY#", ""));
  colissionParams = {
    "TableName": "NVIO",
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": {"S": job.data.companyData.Items[0].PK.S},":cd421": {"S": "ORDER#"+job.id.substring(6)}}
  }
  colissionResult = await query(colissionParams);
  if (colissionResult.Count != 0) {
    console.log("COLISSION DETECTED! ERROR!");
    job.progress(100);
    return Promise.reject(new Error('Colission detected for order ' + job.id.substring(6)));
  }

  

  job.progress(100);
  return Promise.resolve({status:"ok"});

}

async function put(params){
  console.log("RUNNING PUT");
  try {
    var dynamoDbClient = new aws.DynamoDB();
    const putOutput = await docClient.put(params).promise();
    console.info('Update successful.');
    return putOutput;
  } catch (err) {
    console.log(err);
    return err;
  }
}

async function query(params) {
  console.log("RUNNING QUERY");
  try {
    var dynamoDbClient = new aws.DynamoDB();
    const queryOutput = await dynamoDbClient.query(params).promise();
    console.info('Query successful.');
    return queryOutput;
  } catch (err) {
    console.log(err);
    return err;
  }
}

async function geocode(address){
  try {
    const client = new Client({});
    const geocodedData = await client.geocode({params: {key: process.env.GAPI, address: address}, timeout: 1000});
    return geocodedData.data.results[0];
  } catch (err) {
    return err;
  }
}
