const express = require('express');
const passport = require('passport');
const router = express.Router();
const aws = require("aws-sdk");
var multer  = require('multer');
var upload = multer();

// Dashboard Index
router.get('/', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), (req, res) => {
    const name = "Dashboard";
    console.log("Dashboard Index Requested");
    res.render('dashboard/dashboard', {title: name});
});

// Dashboard Profile
router.get('/perfil', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), (req, res) => {
  console.log("Dashboard Profile Requested");
  const name = "Mi Perfil";
  params = {
    "TableName": "NVIO",
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": {"S": req.user},":cd421": {"S": req.user.replace("COMPANY", "PROFILE")}}
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
      res.render('dashboard/dash-perfil', {
        title: name,
        companyName: companyName,
        companyRut: companyRut,
        companyTurn: companyTurn,
        companyRepresentative: companyRepresentative,
        companyContactNumber: companyContactNumber,
        companyEmail: companyEmail
      })
    }
  });
});

// Dashboard Make New Order
router.get('/nuevo-envio', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), (req, res) => {
    const name = "Nuevo Envio";
    console.log("Dashboard New Order Requested");
    res.render('dashboard/dash-envio', {title: name});
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
    "ExpressionAttributeValues": {":cd420": {"S": req.user},":cd421": {"S": req.user.replace("COMPANY", "PROFILE")}}
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

      res.render('dashboard/dash-editar-perfil', {
        title: name,
        companyName: companyName,
        companyRut: companyRut,
        companyTurn: companyTurn,
        companyRepresentative: companyRepresentative,
        companyContactNumber: companyContactNumber,
        companyEmail: companyEmail
      });
    }
  });
});

router.post('/editar-perfil', upload.none(), passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), (req, res) => {
  console.log("Edit Profile Save Requested");
  var docClient = new aws.DynamoDB.DocumentClient()
  params = {
    "TableName": "NVIO",
    "Key": {"PK": req.user, "SK": req.user.replace("COMPANY", "PROFILE")},
    "UpdateExpression": "SET #6a210 = :6a210, #6a211 = :6a211, #6a212 = :6a212, #6a213 = :6a213, #6a214 = :6a214, #6a215 = :6a215",
    "ExpressionAttributeValues": {
      ":6a210": req.body.companyName,
      ":6a211": req.body.companyRut,
      ":6a212": req.body.companyTurn,
      ":6a213": req.body.companyRepresentative,
      ":6a214": parseInt(req.body.companyContactNumber),
      ":6a215": req.body.companyEmail
    },
    "ExpressionAttributeNames": {
      "#6a210": "companyName",
      "#6a211": "companyRut",
      "#6a212": "companyTurn",
      "#6a213": "companyRepresentative",
      "#6a214": "companyContactNumber",
      "#6a215": "companyEmail"
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
});

module.exports = router;
