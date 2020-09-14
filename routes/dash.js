const express = require('express');
const passport = require('passport');
const router = express.Router();
const aws = require("aws-sdk");
const {Client, Status} = require("@googlemaps/google-maps-services-js");
const { v4: uuidv4 } = require('uuid');
const xlsx = require("xlsx");
var validator = require('validator');
const { validate, clean, format } = require('rut.js')
var { nanoid } = require("nanoid");
var multer  = require('multer');
var upload = multer();
var s3Endpoint = new aws.Endpoint(process.env.AWS_S3_ENDPOINT);
const fs = require('fs');
const {Worker, workerData} = require('worker_threads');
let rawComunas = fs.readFileSync('./data/comunas.json');
let comunas = JSON.parse(rawComunas);

/**
 * Name: Dashboard Index
 * Desc: Shows the dashboard index. Recent 5 orders and shipping cost table.
 * URL: /dashboard
 * Method: GET
 */

router.get('/', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), async (req, res, next) => {
  if (req.user.user.includes("ADMIN")){
    return res.redirect('/');
  }
  else if (req.user.user.includes("DRIVER")) {
    return res.redirect('/');
  }
  else {
    //Define orders array
    var orders = [];
    //Define locality
    var locality = "";
    //Define costs array
    var costs = [];
    //Define DynamoDB
    var docClient = new aws.DynamoDB();
    //Define order query params
    var orderParams={
      "TableName": "NVIO",
      "ScanIndexForward": false,
      "ConsistentRead": false,
      "KeyConditionExpression": "#cd420 = :cd420 And begins_with(#cd421, :cd421)",
      "ExpressionAttributeValues": {
        ":cd420": {
          "S": req.user.user
        },
        ":cd421": {
          "S": "ORDER"
        }
      },
      "ExpressionAttributeNames": {
        "#cd420": "PK",
        "#cd421": "SK"
      }
    }
    //Define user data params
    var userParams={
      "TableName": "NVIO",
      "ScanIndexForward": false,
      "ConsistentRead": false,
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
        "#cd421": "SK"
      }
    }
    //Get recent 5 orders (or less)
    docClient.query(orderParams, function(err, data) {
      if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
      } else {
        //Sort orders
        data.Items.sort(function(a, b) {
          return parseFloat(b.createdAt.N) - parseFloat(a.createdAt.N);
        });
        //Put first 5 orders in array
        for (var i = 0; i < 5; i++) {
          if(data.Items[i]){
            orders[i] = data.Items[i];
          }
        }
        //Get locality
        docClient.query(userParams, function(err, data) {
          if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
          } else {
            if (!data.Items[0].fromAddress) {
              res.redirect('/dashboard/editar-perfil');
              return 0;
            }
            locality = data.Items[0].fromAddress.M.locality.S
            //Define shipping prices params
            var pricesParams={
              "TableName": "NVIO",
              "ScanIndexForward": false,
              "ConsistentRead": false,
              "KeyConditionExpression": "#cd420 = :cd420 And begins_with(#cd421, :cd421)",
              "FilterExpression": "#cd422 = :cd422 Or #cd423 = :cd423",
              "ExpressionAttributeValues": {
                ":cd420": {
                  "S": "COMUNA"
                },
                ":cd421": {
                  "S": "COSTO"
                },
                ":cd422": {
                  "S": data.Items[0].fromAddress.M.locality.S
                },
                ":cd423": {
                  "S": data.Items[0].fromAddress.M.locality.S
                }
              },
              "ExpressionAttributeNames": {
                "#cd420": "PK",
                "#cd421": "SK",
                "#cd422": "comuna1",
                "#cd423": "comuna2"
              }
            }
            docClient.query(pricesParams, function(err, data) {
              if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
              } else {
                data.Items.forEach((item, i) => {
                  costs[i] = {};
                  if (item.comuna1.S == locality) {
                    costs[i].locality = item.comuna2.S;
                    costs[i].cost = item.costo.N
                  }
                  else {
                    costs[i].locality = item.comuna1.S;
                    costs[i].cost = item.costo.N
                  }
                });
                const name = "Dashboard"
                res.render('dashboard/dashboard', {title: name, orders: orders, locality: locality, costs: costs});
              }
            });
          }
        });
      }
    });
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
  var s3 = new aws.S3({params: {Bucket: process.env.AWS_S3_BUCKET}, endpoint: s3Endpoint});
  var logo = s3.getSignedUrl('getObject', {Key: req.user.user.replace("COMPANY#","")+".png", Expires: 60});
  var docClient = new aws.DynamoDB();
  docClient.query(params, function(err, data) {
    if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
      console.log("Query succeeded.");
      if (data.Items[0].legalName) {
        var legalName = data.Items[0].legalName.S;
      }
      if (data.Items[0].companyName) {
        var companyName = data.Items[0].companyName.S;
      }
      if (data.Items[0].companyRut) {
        var companyRut = data.Items[0].companyRut.S;
      }
      if (data.Items[0].companyTurn) {
        var companyTurn = data.Items[0].companyTurn.S;
      }
      if (data.Items[0].companyRepresentative) {
        var companyRepresentative = data.Items[0].companyRepresentative.S;
      }
      if (data.Items[0].companyContactNumber) {
        var companyContactNumber = data.Items[0].companyContactNumber.N;
      }
      if (data.Items[0].companyEmail) {
        var companyEmail = data.Items[0].companyEmail.S;
      }
      if (data.Items[0].fromAddress) {
        var address = data.Items[0].fromAddress.M.street.S + " " + data.Items[0].fromAddress.M.number.N;
        if (data.Items[0].fromAddress.M.locality.S){
          var comuna = data.Items[0].fromAddress.M.locality.S;
        }
      }
      if (data.Items[0].fromApart){
        var addressApart = data.Items[0].fromApart.S;
      }
      res.render('dashboard/dash-perfil', {
        title: name,
        companyId: req.user.user.replace("COMPANY#",""),
        legalName: legalName,
        companyName: companyName,
        companyRut: companyRut,
        companyTurn: companyTurn,
        companyRepresentative: companyRepresentative,
        companyContactNumber: companyContactNumber,
        companyEmail: companyEmail,
        address: address,
        addressApart: addressApart,
        logo: logo,
        comuna: comuna
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
      if (!data.Items[0].fromAddress) {
        return res.redirect('/dashboard/');
      }
      companyAddress = `${data.Items[0].fromAddress.M.street.S} ${data.Items[0].fromAddress.M.number.N}`;
      companyLocality = data.Items[0].fromAddress.M.locality.S;
      companyAddressApart = data.Items[0].fromApart.S;
      const name = "Nuevo Envío";
      console.log("Dashboard New Order Requested");
      if (validator.isEmpty(data.Items[0].companyContactNumber.N)) {
        return res.redirect('/dashboard/');
      }
      if (validator.isEmpty(data.Items[0].companyRepresentative.S)) {
        return res.redirect('/dashboard/');
      }
      if (validator.isEmpty(data.Items[0].companyName.S)) {
        return res.redirect('/dashboard/');
      }
      if (validator.isEmpty(data.Items[0].fromAddress.M.street.S)) {
        return res.redirect('/dashboard/');
      }
      if (validator.isEmpty(data.Items[0].companyRut.S)) {
        return res.redirect('/dashboard/');
      }
      if (validator.isEmpty(data.Items[0].email.S)) {
        return res.redirect('/dashboard/');
      }
      if (validator.isEmpty(data.Items[0].companyEmail.S)) {
        return res.redirect('/dashboard/');
      }
      if (validator.isEmpty(data.Items[0].companyTurn.S)) {
        return res.redirect('/dashboard/');
      }
      res.render('dashboard/dash-envio', {title: name, uuid: uuidv4(), companyAddress: companyAddress, companyAddressApart: companyAddressApart, companyLocality: companyLocality, comunas: comunas});

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
  const client = new Client({});

  //FORM VALIDATION
  if (validator.isEmpty(req.body.fromAddress)){
    return res.redirect("/dashboard/nuevo-envio");
  }

  if (validator.isEmpty(req.body.toAddress)){
    return res.redirect("/dashboard/nuevo-envio");
  }

  if (validator.isEmpty(req.body.nameDest)){
    return res.redirect("/dashboard/nuevo-envio");
  }

  if (!validator.isLength(req.body.contactDest , {min:9, max: 9})){
    return res.redirect('/dashboard/nuevo-envio')
  }

  if (validator.isEmpty(req.body.orderName)){
    return res.redirect("/dashboard/nuevo-envio");
  }

  if (validator.isEmpty(req.body.orderDesc)){
    return res.redirect("/dashboard/nuevo-envio");
  }

  if (!validator.isNumeric(req.body.orderValue)){
    return res.redirect("/dashboard/nuevo-envio");
  }

  if (!req.body.tos){
    return res.redirect("/dashboard/nuevo-envio");
  }

  client.geocode({params: {key: process.env.GAPI, address: req.body.fromAddress + " " + req.body.fromLocality + ", Santiago"}, timeout: 1000}).then(r => {
    fromGeocodedData = r.data.results[0].address_components;
    fromLocation = r.data.results[0].geometry.location;
    if (r.data.results[0].partial_match || r.data.results[0].address_components[0].types != "street_number") {
      return res.redirect('/dashboard/nuevo-envio');
      console.log("INVALID FROM ADDRESS");
    }
    client.geocode({params: {key: process.env.GAPI, address: req.body.toAddress + " " + req.body.toLocality + ", Santiago"}, timeout: 1000}).then(r => {
      console.log(r.data.results[0]);
      toGeocodedData = r.data.results[0].address_components;
      toLocation = r.data.results[0].geometry.location;
      if (r.data.results[0].partial_match || r.data.results[0].address_components[0].types != "street_number") {
        console.log("INVALID TO ADDRESS");
        return res.redirect('/dashboard/nuevo-envio');
      }
      colcheck();
    }).catch(e => {
      console.log(e);
    });
  }).catch(e => {
    console.log(e);
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
          localities = [req.body.fromLocality, req.body.toLocality];
          localities.sort((a, b) => a.localeCompare(b, 'es', {sensitivity: 'base'}))
          console.log(localities);

          var costParams={
            "TableName": "NVIO",
            "ScanIndexForward": false,
            "ConsistentRead": false,
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
            FilterExpression: "comuna1 = :cd422 AND comuna2 = :cd423"
          }
          docClient.query(costParams, function(err, data) {
            if (err) {
              console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            } else {
              console.log(req.body);
              console.log(req.user.user);
              console.log("COSTO ENVIO " + data.Items[0].costo.N);
              console.log("ORDER#"+orderID);
              docClient = new aws.DynamoDB.DocumentClient();
              params = {
                TableName:'NVIO',
                Item:{
                  "PK": req.user.user,
                  "SK": "ORDER#"+orderID,
                  "fromAddress": {
                    "locality": fromGeocodedData[3].long_name,
                    "number": parseInt(fromGeocodedData[0].long_name),
                    "street": fromGeocodedData[1].long_name,
                    "latitude": fromLocation.lat,
                    "longitude": fromLocation.lng
                  },
                  "fromApart": req.body.fromApart,
                  "toAddress": {
                    "locality": toGeocodedData[3].long_name,
                    "number": parseInt(toGeocodedData[0].long_name),
                    "street": toGeocodedData[1].long_name,
                    "latitude": toLocation.lat,
                    "longitude": toLocation.lng
                  },
                  "toApart": req.body.toApart,
                  "orderName": req.body.orderName,
                  "orderDesc": req.body.orderDesc,
                  "orderValue": parseInt(req.body.orderValue),
                  "nameDest": req.body.nameDest,
                  "contactDest": req.body.contactDest,
                  "emailDest": req.body.emailDest,
                  "comment": req.body.comment,
                  "shippingCost": parseInt(data.Items[0].costo.N),
                  "status": 0,
                  "createdAt": Date.now()
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
          });
        }
        else {
          colcheck();
        }
      }
    });
  }
});

/**
 * Name: Order history GET
 * Desc: Lists order history
 * URL: /dashboard/hist-pedidos
 * Method: GET
 */

router.get('/hist-pedidos', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), (req, res) => {
    const name = "Historial Pedidos";
    console.log("Dashboard Order History Requested");
    var docClient = new aws.DynamoDB();
    var params={
      "TableName": "NVIO",
      "ScanIndexForward": false,
      "ConsistentRead": false,
      "KeyConditionExpression": "#cd420 = :cd420 And begins_with(#cd421, :cd421)",
      "ExpressionAttributeValues": {
        ":cd420": {
          "S": req.user.user
        },
        ":cd421": {
          "S": "ORDER"
        }
      },
      "ExpressionAttributeNames": {
        "#cd420": "PK",
        "#cd421": "SK"
      }
    }
    docClient.query(params, function(err, data) {
      if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
      } else {
        res.render('dashboard/dash-hist-pedidos', {title: name, orders: data.Items, companyId: req.user.user.replace("COMPANY#","")});
      }
    });
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
  var s3 = new aws.S3({params: {Bucket: process.env.AWS_S3_BUCKET}, endpoint: s3Endpoint});
  var logo = s3.getSignedUrl('getObject', {Key: req.user.user.replace("COMPANY#","")+".png", Expires: 60});
  var docClient = new aws.DynamoDB();
  docClient.query(params, function(err, data) {
    if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
      console.log("Query succeeded.");
      if (data.Items[0].legalName) {
        var legalName = data.Items[0].legalName.S;
      }
      if (data.Items[0].companyName) {
        var companyName = data.Items[0].companyName.S;
      }
      if (data.Items[0].companyRut) {
        var companyRut = data.Items[0].companyRut.S;
      }
      if (data.Items[0].companyTurn) {
        var companyTurn = data.Items[0].companyTurn.S;
      }
      if (data.Items[0].companyRepresentative) {
        var companyRepresentative = data.Items[0].companyRepresentative.S;
      }
      if (data.Items[0].companyContactNumber) {
        var companyContactNumber = data.Items[0].companyContactNumber.N;
      }
      if (data.Items[0].companyEmail) {
        var companyEmail = data.Items[0].companyEmail.S;
      }
      if (data.Items[0].fromAddress) {
        var address = data.Items[0].fromAddress.M.street.S + " " + data.Items[0].fromAddress.M.number.N;
        if (data.Items[0].fromAddress.M.locality.S){
          var comuna = data.Items[0].fromAddress.M.locality.S;
        }
      }
      if (data.Items[0].fromApart){
        var addressApart = data.Items[0].fromApart.S;
      }

      res.render('dashboard/dash-editar-perfil', {
        title: name,
        legalName: legalName,
        companyName: companyName,
        companyRut: companyRut,
        companyTurn: companyTurn,
        companyRepresentative: companyRepresentative,
        companyContactNumber: companyContactNumber,
        companyEmail: companyEmail,
        address: address,
        comunas: comunas,
        comuna: comuna,
        addressApart: addressApart,
        logo: logo
      });
    }
  });
});

router.post('/editar-perfil', upload.single('logo'), passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), (req, res) => {
  console.log("Edit Profile Save Requested");
  if (req.file) {
    console.log("FILE SAVING REQUESTED!!");
    console.log(req.file);

    if (req.file.mimetype == "image/png") {

      var s3 = new aws.S3({params: {Bucket: process.env.AWS_S3_BUCKET}, endpoint: s3Endpoint});
      var params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: req.user.user.replace("COMPANY#","")+".png",
        ACL: 'public-read',
        Body: req.file.buffer
      }
      s3.putObject(params, function (err, data) {
        if (err) {
          console.log("Error: ", err);
        } else {
          //console.log(data);
          //return res.json("ok");
        }
      });

    } else {
      return res.redirect('/dashboard/editar-perfil')
    }
  }
  var geocodedData;
  var location;
  const client = new Client({});

  if (validator.isEmpty(req.body.legalName)){
    return res.redirect('/dashboard/editar-perfil')
  }

  if (validator.isEmpty(req.body.companyName)){
    return res.redirect('/dashboard/editar-perfil')
  }

  if (!validate(req.body.companyRut)){
    return res.redirect('/dashboard/editar-perfil')
  }

  if (validator.isEmpty(req.body.companyTurn)){
    return res.redirect('/dashboard/editar-perfil')
  }
  if (validator.isEmpty(req.body.comuna)){
    return res.redirect('/dashboard/editar-perfil')
  }

  if (validator.isEmpty(req.body.companyRepresentative)){
    return res.redirect('/dashboard/editar-perfil')
  }

  if (!validator.isLength(req.body.companyContactNumber , {min:9, max: 9})){
    return res.redirect('/dashboard/editar-perfil')
  }

  if (!validator.isNumeric(req.body.companyContactNumber)){
    return res.redirect('/dashboard/editar-perfil')
  }

  if (!validator.isEmail(req.body.companyEmail)){
    return res.redirect('/dashboard/editar-perfil')
  }

  if (validator.isEmpty(req.body.address)){
    return res.redirect('/dashboard/editar-perfil')
  }
  //Append comuna and Santiago to address
  // NOTE: Fix when we expand to other cities!!!!!!!!!!!
  var completeAddress = req.body.address + ", " + req.body.comuna + ", Santiago";
  console.log(completeAddress);
  client.geocode({params: {key: process.env.GAPI, address: completeAddress}, timeout: 1000}).then(r => {
    geocodedData = r.data.results[0].address_components;
    if (r.data.results[0].partial_match || r.data.results[0].address_components[0].types != "street_number") {
      res.redirect('/dashboard/editar-perfil');
    }
    location = r.data.results[0].geometry.location;
    var docClient = new aws.DynamoDB.DocumentClient();
    params = {
      "TableName": "NVIO",
      "Key": {"PK": req.user.user, "SK": req.user.user.replace("COMPANY", "PROFILE")},
      "UpdateExpression": "SET #6a209 = :6a209, #6a210 = :6a210, #6a211 = :6a211, #6a212 = :6a212, #6a213 = :6a213, #6a214 = :6a214, #6a215 = :6a215, #6a216 = :6a216, #6a217 = :6a217",
      "ExpressionAttributeValues": {
        ":6a209": req.body.legalName,
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
          "longitude": location.lng
        },
        ":6a217": req.body.addressApart
      },
      "ExpressionAttributeNames": {
        "#6a209": "legalName",
        "#6a210": "companyName",
        "#6a211": "companyRut",
        "#6a212": "companyTurn",
        "#6a213": "companyRepresentative",
        "#6a214": "companyContactNumber",
        "#6a215": "companyEmail",
        "#6a216": "fromAddress",
        "#6a217": "fromApart"
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

router.get('/nuevo-envio/get-costo/:c1/:c2', (req,res)=> {
  var c1bad = true;
  var c2bad = true;
  comunas.forEach((item, i) => {
    if (item == req.params.c1) {
      c1bad = false;
    }
    if (item == req.params.c2) {
      c2bad = false;
    }
  });
  if (c1bad == true || c2bad == true){
    res.json({costo: "Comunas inválidas..."});
  } else {
    var docClient = new aws.DynamoDB();
    var params={
      "TableName": "NVIO",
      "ScanIndexForward": false,
      "ConsistentRead": false,
      "KeyConditionExpression": "#cd420 = :cd420 And begins_with(#cd421, :cd421)",
      "ExpressionAttributeValues": {
        ":cd420": {
          "S": "COMUNA"
        },
        ":cd421": {
          "S": "COSTO"
        },
        ":cd422": {
          "S": req.params.c1
        },
        ":cd423": {
          "S": req.params.c2
        }
      },
      "ExpressionAttributeNames": {
        "#cd420": "PK",
        "#cd421": "SK"
      },
      FilterExpression: "comuna1 = :cd422 AND comuna2 = :cd423"
    }
    docClient.query(params, function(err, data) {
      if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
      } else {
        res.json({costo: data.Items[0].costo.N});
      }
    });
  }
})

router.post('/cancelar-envio', upload.none(), passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), (req,res)=> {
  //Validate in backend if status != 0
  var docClient = new aws.DynamoDB();
  var getParams={
    "TableName": "NVIO",
    "ScanIndexForward": false,
    "ConsistentRead": false,
    "KeyConditionExpression": "#cd420 = :cd420 And begins_with(#cd421, :cd421)",
    "ExpressionAttributeValues": {
      ":cd420": {
        "S": req.user.user
      },
      ":cd421": {
        "S": req.body.order
      }
    },
    "ExpressionAttributeNames": {
      "#cd420": "PK",
      "#cd421": "SK"
    }
  }
  docClient.query(getParams, function(err, data) {
    if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
      if (parseInt(data.Items[0].status.N) == 0) {
        var delParams = {
          "TableName": "NVIO",
          Key:{
            "PK": req.user.user,
            "SK": req.body.order
          },
          ReturnValues: "ALL_OLD"
        }
        var docClient = new aws.DynamoDB.DocumentClient();
        docClient.delete(delParams, function(err, data) {
          if (err) {
            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
          } else {
            console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
            res.redirect('/dashboard/hist-pedidos');
          }
        });
      }
      else {
        res.redirect('/dashboard/hist-pedidos');
      }
    }
  });
});

router.post('/subir-excel', upload.single('planilla'), passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), async (req,res) => {

  if (req.file) {
    console.log("FILE SAVING REQUESTED!!");
    var workers = [];
    var workbook = xlsx.read(req.file.buffer);
    var sheetNameList = workbook.SheetNames;
    var orderList = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]], {range: 2});
    res.json(orderList);
    var params ={
      "TableName": "NVIO",
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
        "#cd421": "SK"
      }
    }
    companyData = await query(params);
    orderList.forEach(async (item, i) => {
      workers[i] = new Worker('./workers/importExcel.js', {workerData: {companyData: companyData.Items, orderData:item, id: i, gapi: process.env.GAPI}});
    });
  }
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
    const scanOutput = await dynamoDbClient.scan(params).promise();
    console.info('Scan successful.');
    return scanOutput;
  } catch (err) {
    console.log(err);
    return err;
  }
}

async function update(params){
  console.log("RUNNING UPDATE");
  try {
    var dynamoDbClient = new aws.DynamoDB();
    const updateOutput = await docClient.update(params).promise();
    console.info('Update successful.');
    return updateOutput;
  } catch (err) {
    console.log(err);
    return err;
  }
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

module.exports = router;
