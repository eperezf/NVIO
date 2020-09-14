const {parentPort, workerData} = require('worker_threads');
const {Client, Status} = require("@googlemaps/google-maps-services-js");
const aws = require("aws-sdk");

async function process(){
  console.log("WORKER "+workerData.id+" RUNNING");
  var fromAddress = "";
  var toAddress = "";
  if (!workerData.orderData.dir_orig) {
    console.log("WORKER "+workerData.id+" WILL USE DEFAULT ORIGIN ADDRESS. NO NEED TO GEOCODE");
  }
  else {
    console.log("WORKER "+workerData.id+" WILL USE CUSTOM ORIGIN ADDRESS. MUST BE GEOCODED!");
    console.log(workerData.orderData.dir_orig + ", " + workerData.orderData.comuna_orig + ", Santiago");
    console.log("GEOCODING");
    fromAddress = await geocode(workerData.orderData.dir_orig + ", " + workerData.orderData.comuna_orig + ", Santiago");
    console.log(fromAddress);
  }
}

process();





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

async function geocode(address){
  try {
    const client = new Client({});
    const geocodedData = await client.geocode({params: {key: workerData.gapi, address: address}, timeout: 1000});
    return geocodedData.data.results[0];
  } catch (err) {
    return err;
  }
}
