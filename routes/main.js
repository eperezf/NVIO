const express = require('express');
const passport = require('passport');
const router = express.Router();

//Index route
router.get('/', (req, res) => {
  console.log("Index requested");
  res.render('index', {title: "NVIO | Inicio"});
});

//Quienes somos route
router.get('/quienes-somos', (req, res) => {
  console.log("Quienes Somos requested");
  var date = new Date();
  var year = date.getFullYear();
  res.render('quienes-somos', {title: "NVIO | Quienes Somos"});
});

//login route
router.get('/login', (req, res) => {
  console.log("Login requested");
  var date = new Date();
  var year = date.getFullYear();
  res.render('login', {title: "NVIO | Login"});
});


module.exports = router;
