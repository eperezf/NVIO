const express = require('express');
const passport = require('passport');
const router = express.Router();
const aws = require("aws-sdk");
const { v4: uuidv4 } = require('uuid');
const {Client, Status} = require("@googlemaps/google-maps-services-js");
var { nanoid } = require("nanoid");
var multer  = require('multer');
var upload = multer();

// Dashboard Index
router.get('/', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), (req, res) => {
    if (req.user.user.includes("ADMIN")){
      return res.redirect('/');
    }
    else if (req.user.user.includes("DRIVER")) {
      return res.redirect('/');
    }
    else {
      const name = "Dashboard";
      console.log("Dashboard Index Requested");
      res.render('dashboard/dashboard', {title: name});
    }
});

/**
 * Name: Company profile
 * Desc: Shows the company profile data
 * URL: /dashboard/perfil
 * Method: GET
 */
router.get('/perfil', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), (req, res) => {
  console.log("Dashboard Profile Requested");
  const name = "Mi Perfil";
  params = {
    "TableName": "NVIO",
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": {"S": req.user.user},":cd421": {"S": req.user.user.replace("COMPANY", "PROFILE")}}
  }
  var docClient = new aws.DynamoDB();
  docClient.query(params, function(err, data) {
    if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
      console.log("Query succeeded.");
      var companyName = data.Items[0].companyName.S;
      var companyRut = data.Items[0].companyRut.S;
      var companyTurn = data.Items[0].companyTurn.S;
      var companyRepresentative = data.Items[0].companyRepresentative.S;
      var companyContactNumber = data.Items[0].companyContactNumber.N;
      var companyEmail = data.Items[0].companyEmail.S;
      var address = data.Items[0].fromAddress.M.street.S + " " + data.Items[0].fromAddress.M.number.N + ", " + data.Items[0].fromAddress.M.locality.S;
      var addressApart = data.Items[0].fromAddressApart.S;
      res.render('dashboard/dash-perfil', {
        title: name,
        companyName: companyName,
        companyRut: companyRut,
        companyTurn: companyTurn,
        companyRepresentative: companyRepresentative,
        companyContactNumber: companyContactNumber,
        companyEmail: companyEmail,
        address: address,
        addressApart: addressApart
      })
    }
  });
});

/**
 * Name: New Order GET
 * Desc: Render the new order form.
 * URL: /dashboard/nuevo-envio
 * Method: GET
 */

router.get('/nuevo-envio', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), (req, res) => {
  var companyAddress;
  var companyAddressApart;
  var docClient = new aws.DynamoDB();
  params = {
    "TableName": "NVIO",
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": {"S": req.user.user},":cd421": {"S": req.user.user.replace("COMPANY", "PROFILE")}}
  }
  docClient.query(params, function(err, data) {
    if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
      console.log("Query succeeded.");
      console.log(data);
      companyAddress = data.Items[0].fromAddress.S;
      companyAddressApart = data.Items[0].fromAddressApart.S;
      const name = "Nuevo Envio";
      console.log("Dashboard New Order Requested");
      res.render('dashboard/dash-envio', {title: name, uuid: uuidv4(), companyAddress: companyAddress, companyAddressApart: companyAddressApart});
    }
  });
});

/**
 * Name: New Order POST
 * Desc: Generates a new order with the parameters given from New Order GET
 * URL: /dashboard/nuevo-envio
 * Method: POST
 */

router.post('/nuevo-envio', upload.none(), passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), (req, res) => {
  var docClient = new aws.DynamoDB();
  var companyAddress;
  var companyAddressApart;
  params = {
    "TableName": "NVIO",
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": {"S": req.user.user},":cd421": {"S": req.user.user.replace("COMPANY", "PROFILE")}}
  }
  docClient.query(params, function(err, data) {
    if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
      console.log("Query succeeded.");
      console.log(data);
      companyAddress = data.Items[0].fromAddress.S;
      companyAddressApart = data.Items[0].fromAddressApart.S;
      colcheck();
    }
  });
  function colcheck(){
    orderID = nanoid(6);
    //Check for ID colission
    console.log("Checking for Order ID collision");
    console.log("PK: "+ req.user.user +", SK: ORDER#"+orderID);
    params = {
      "TableName": "NVIO",
      "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
      "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
      "ExpressionAttributeValues": {":cd420": {"S": req.user.user},":cd421": {"S": "ORDER#"+orderID}}
    }
    var docClient = new aws.DynamoDB();
    docClient.query(params, function(err, data) {
      if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
      } else {
        console.log(data);
        if (data.Count == 0) {
          console.log("No collision. Creating Order.");
          uoid = req.user.user.replace("COMPANY#", "")+orderID;
          console.log(req.body);
          console.log(req.user.user);
          console.log("ORDER#"+orderID);
          console.log("UNIQUE ORDER ID: " + uoid);
          docClient = new aws.DynamoDB.DocumentClient();
          params = {
            TableName:'NVIO',
            Item:{
                "PK": req.user.user,
                "SK": "ORDER#"+orderID,
                "fromAddress": companyAddress,
                "fromApart": companyAddressApart,
                "toAddress": req.body.toAddress,
                "toApart": req.body.toApart,
                "orderName": req.body.orderName,
                "orderDesc": req.body.orderDesc,
                "orderValue": parseInt(req.body.orderValue),
                "status": 0,
                "createdAt": parseInt(Date.now())
            }
          };
          console.log("Adding a new item...");
          docClient.put(params, function(err, data) {
            if (err) {
              console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
              console.log("Added item:", JSON.stringify(data, null, 2));
              return res.redirect("/dashboard/hist-pedidos");
            }
          });
        }
        else {
          colcheck();
        }
      }
    });
  }


});

// Dashboard Order History
router.get('/hist-pedidos', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), (req, res) => {
    const name = "Historial Pedidos";
    console.log("Dashboard Order History Requested");
    res.render('dashboard/dash-hist-pedidos', {title: name});
});

// Dashboard Payment History
router.get('/hist-pagos', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), (req, res) => {
    const name = "Historial Pagos";
    console.log("Dashboard Payment History Requested");
    res.render('dashboard/dash-hist-pagos', {title: name});
});

// Dashboard Cost Tables
router.get('/costos', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), (req, res) => {
    const name = "Tablas de Costos";
    console.log("Dashboard Cost Tables Requested");
    res.render('dashboard/dash-costos', {title: name});
});

// Dashboard Support
router.get('/soporte', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), (req, res) => {
    const name = "Ayuda y Soporte";
    console.log("Dashboard Support Requested");
    res.render('dashboard/dash-soporte', {title: name});
});

// Dashboard Edit Profile
router.get('/editar-perfil', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), (req, res) => {
  const name = "Editar Perfil";
  console.log("Dashboard Edit Profile Requested");
  params = {
    "TableName": "NVIO",
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": {"S": req.user.user},":cd421": {"S": req.user.user.replace("COMPANY", "PROFILE")}}
  }
  var docClient = new aws.DynamoDB();
  docClient.query(params, function(err, data) {
    if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
      console.log("Query succeeded.");
      var companyName = data.Items[0].companyName.S;
      var companyRut = data.Items[0].companyRut.S;
      var companyTurn = data.Items[0].companyTurn.S;
      var companyRepresentative = data.Items[0].companyRepresentative.S;
      var companyContactNumber = data.Items[0].companyContactNumber.N;
      var companyEmail = data.Items[0].companyEmail.S;
      var address = data.Items[0].fromAddress.M.street.S + " " + data.Items[0].fromAddress.M.number.N + ", " + data.Items[0].fromAddress.M.locality.S;
      var addressApart = data.Items[0].fromAddressApart.S;

      res.render('dashboard/dash-editar-perfil', {
        title: name,
        companyName: companyName,
        companyRut: companyRut,
        companyTurn: companyTurn,
        companyRepresentative: companyRepresentative,
        companyContactNumber: companyContactNumber,
        companyEmail: companyEmail,
        address: address,
        addressApart: addressApart
      });
    }
  });
});

router.post('/editar-perfil', upload.none(), passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), (req, res) => {
  console.log("Edit Profile Save Requested");
  var geocodedData;
  var location;
  const client = new Client({});
  client.geocode({params: {key: process.env.GAPI, address: req.body.address}, timeout: 1000}).then(r => {
    geocodedData = r.data.results[0].address_components;
    location = r.data.results[0].geometry.location;
    var docClient = new aws.DynamoDB.DocumentClient();
    params = {
      "TableName": "NVIO",
      "Key": {"PK": req.user.user, "SK": req.user.user.replace("COMPANY", "PROFILE")},
      "UpdateExpression": "SET #6a210 = :6a210, #6a211 = :6a211, #6a212 = :6a212, #6a213 = :6a213, #6a214 = :6a214, #6a215 = :6a215, #6a216 = :6a216, #6a217 = :6a217",
      "ExpressionAttributeValues": {
        ":6a210": req.body.companyName,
        ":6a211": req.body.companyRut,
        ":6a212": req.body.companyTurn,
        ":6a213": req.body.companyRepresentative,
        ":6a214": parseInt(req.body.companyContactNumber),
        ":6a215": req.body.companyEmail,
        ":6a216": {
          "locality": geocodedData[3].long_name,
          "number": parseInt(geocodedData[0].long_name),
          "street": geocodedData[1].long_name,
          "latitude": location.lat,
          "longitude": location.lng},
        ":6a217": req.body.addressApart
      },
      "ExpressionAttributeNames": {
        "#6a210": "companyName",
        "#6a211": "companyRut",
        "#6a212": "companyTurn",
        "#6a213": "companyRepresentative",
        "#6a214": "companyContactNumber",
        "#6a215": "companyEmail",
        "#6a216": "fromAddress",
        "#6a217": "fromAddressApart"
      },
      ReturnValues:"UPDATED_NEW"
    }
    docClient.update(params, function(err, data) {
      if (err) {
        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
      } else {
        console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
        res.redirect('/dashboard/perfil');
      }
    });
  }).catch(e => {
    console.log(e);
  });


});

module.exports = router;
