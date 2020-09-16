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
  var fromAddress = {};
  fromAddress.apart = "";
  var toAddress = {};
  toAddress.apart = "";
  var geocodedData = {};
  //Check origin address
  if (!job.data.orderData.dir_orig) {
    fromAddress.locality = job.data.companyData.Items[0].fromAddress.M.locality.S;
    fromAddress.number = job.data.companyData.Items[0].fromAddress.M.number.N;
    fromAddress.street = job.data.companyData.Items[0].fromAddress.M.street.S;
    fromAddress.latitude = job.data.companyData.Items[0].fromAddress.M.latitude.N;
    fromAddress.longitude = job.data.companyData.Items[0].fromAddress.M.longitude.N;
    if (job.data.companyData.Items[0].fromApart.S){
      fromAddress.apart = job.data.companyData.Items[0].fromApart.S;
    }
    job.progress(20)
  }
  else {
    geocodedData = await geocode(job.data.orderData.dir_orig + ", " + job.data.orderData.comuna_orig + ", Santiago");
    job.progress(20);
    if (geocodedData.partial_match == true) {
      console.log("#" + job.id + ": ORIGIN ADDRESS DOES NOT EXIST!");
      return Promise.reject(new Error('Origin address '+job.data.orderData.dir_orig + ", " + job.data.orderData.comuna_orig + ", Santiago "+'does not exist'));
    }
    fromAddress.locality = geocodedData.address_components[3].long_name
    fromAddress.number = geocodedData.address_components[0].long_name;
    fromAddress.street = geocodedData.address_components[1].long_name;
    fromAddress.latitude = geocodedData.geometry.location.lat.toString();
    fromAddress.longitude = geocodedData.geometry.location.lng.toString();
    if (job.data.orderData.apart_orig) {
      fromAddress.apart = job.data.orderData.apart_orig;
    }
  }

  //Check destination address
  geocodedData = await geocode(job.data.orderData.dir_dest + ", " + job.data.orderData.comuna_dest + ", Santiago");
  job.progress(40);
  if (geocodedData.partial_match == true) {
    console.log("#" + job.id + ": DESTINATION ADDRESS DOES NOT EXIST!");
    return Promise.reject(new Error('Destination address '+job.data.orderData.dir_dest + ", " + job.data.orderData.comuna_dest + ", Santiago "+'does not exist'));
  }
  else {
    toAddress.locality = geocodedData.address_components[3].long_name
    toAddress.number = geocodedData.address_components[0].long_name;
    toAddress.street = geocodedData.address_components[1].long_name;
    toAddress.latitude = geocodedData.geometry.location.lat.toString();
    toAddress.longitude = geocodedData.geometry.location.lng.toString();
    if (job.data.orderData.apart_dest) {
      toAddress.apart = job.data.orderData.apart_dest;
    }
  }

  //Check ID colission and shipping cost at the same time
  colissionParams = {
    "TableName": "NVIO",
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": {"S": job.data.companyData.Items[0].PK.S},":cd421": {"S": "ORDER#"+job.id.substring(6)}}
  }
  localities = [fromAddress.locality, toAddress.locality];
  localities.sort((a, b) => a.localeCompare(b, 'es', {sensitivity: 'base'}))
  costParams={
    "TableName": "NVIO",
    "KeyConditionExpression": "#cd420 = :cd420 And begins_with(#cd421, :cd421)",
    "ExpressionAttributeValues": {
      ":cd420": {
        "S": "COMUNA"
      },
      ":cd421": {
        "S": "COSTO"
      },
      ":cd422": {
        "S": localities[0]
      },
      ":cd423": {
        "S": localities[1]
      }
    },
    "ExpressionAttributeNames": {
      "#cd420": "PK",
      "#cd421": "SK"
    },
    "FilterExpression": "comuna1 = :cd422 AND comuna2 = :cd423"
  }
  job.progress(60)
  let [colissionResult, costResult] = await Promise.allSettled([query(colissionParams), query(costParams)]);
  if (colissionResult.value.Count != 0) {
    console.log("#" + job.id + ": COLISSION DETECTED!");
    return Promise.reject(new Error('Colission detected for order ' + job.id.substring(6)));
  }
  job.progress(80)
  if (costResult.value.Count != 1){
    console.log("#" + job.id + ": ERROR IN COST CALCULATION!");
    return Promise.reject(new Error('Error in cost calculation for order ' + job.id.substring(6)));
  }

  var orderParams = {
    TableName:'NVIO',
    Item:{
      "PK": job.data.companyData.Items[0].PK.S,
      "SK": "ORDER#"+job.id.substring(6),
      "fromAddress": {
        "locality": fromAddress.locality,
        "number": parseInt(fromAddress.number),
        "street": fromAddress.street,
        "latitude": fromAddress.latitude,
        "longitude": fromAddress.longitude
      },
      "fromApart": fromAddress.apart,
      "toAddress": {
        "locality": toAddress.locality,
        "number": parseInt(toAddress.number),
        "street": toAddress.street,
        "latitude": toAddress.latitude,
        "longitude": toAddress.longitude
      },
      "toApart": toAddress.apart,
      "orderName": job.data.orderData.numero_order.toString(),
      "orderDesc": job.data.orderData.cont_order,
      "orderValue": parseInt(job.data.orderData.valor_order),
      "nameDest": job.data.orderData.nombre_dest,
      "contactDest": job.data.orderData.tel_dest,
      "emailDest": job.data.orderData.email_dest,
      "comment": job.data.orderData.coment_order,
      "shippingCost": parseInt(costResult.value.Items[0].costo.N),
      "status": 0,
      "createdAt": Date.now()
    }
  };
  putResult = await put(orderParams);
  job.progress(100);
  console.log("#" + job.id + ": Completed!");
  return Promise.resolve({status:"ok"});

}

async function put(params){
  try {
    var docClient = new aws.DynamoDB.DocumentClient();
    const putOutput = await docClient.put(params).promise();
    return putOutput;
  } catch (err) {
    console.log(err);
    return err;
  }
}

async function query(params) {
  try {
    var dynamoDbClient = new aws.DynamoDB();
    const queryOutput = await dynamoDbClient.query(params).promise();
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
