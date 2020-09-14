const express = require('express');
const passport = require('passport');
const router = express.Router();
const aws = require('aws-sdk');
var { nanoid } = require("nanoid");
var multer  = require('multer');
const fs = require('fs');
let rawComunas = fs.readFileSync('./data/comunas.json');
let comunas = JSON.parse(rawComunas);


/**
 * Name: Admin index
 * Desc: Shows the admin panel
 * URL: /admin
 * Method: GET
 */
router.get('/', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), async (req, res, next) => {
  console.log("GET ADMIN INDEX");
  var userParams = {
    "TableName": "NVIO",
    "ProjectionExpression": "#cd422",
    "KeyConditionExpression": "#cd420 = :cd420 And begins_with(#cd421, :cd421)",
    "ExpressionAttributeValues": {
      ":cd420": {
        "S": req.user.user
      },
      ":cd421": {
        "S": "PROFILE"
      }
    },
    "ExpressionAttributeNames": {
      "#cd420": "PK",
      "#cd421": "SK",
      "#cd422": "name"
    }
  }

  companyListParams = {
    "TableName": "NVIO",
    "ProjectionExpression": "companyContactNumber, companyRepresentative, companyName, fromAddress, fromApart, companyRut, email, companyEmail, PK, companyTurn, legalName",
    "FilterExpression": "begins_with(#cd420, :cd420) And begins_with(#cd421, :cd421)",
    "ExpressionAttributeValues": {
      ":cd420": {
        "S": "COMPANY"
      },
      ":cd421": {
        "S": "PROFILE"
      }
    },
    "ExpressionAttributeNames": {
      "#cd420": "PK",
      "#cd421": "SK"
    }
  }
  var [companyResult, userResult] = await Promise.all([scan(companyListParams), query(userParams)])
  res.json({user:userResult, companies:companyResult});
})


//DB functions

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

async function scan(params) {
  console.log("RUNNING SCAN");
  try {
    var dynamoDbClient = new aws.DynamoDB();
    const queryOutput = await dynamoDbClient.scan(params).promise();
    console.info('Query successful.');
    return queryOutput;
  } catch (err) {
    console.log(err);
    return err;
  }
}

module.exports = router;
