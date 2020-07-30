const express = require('express');
const passport = require('passport');
const router = express.Router();

//Index route
router.get('/', (req, res) => {
  const name = "Inicio";
  console.log("Index requested");
  res.render('index', {title: name});
});

//Quienes somos route
router.get('/quienes-somos', (req, res) => {
  const name = "Quienes Somos";
  console.log("Quienes Somos requested");
  res.render('quienes-somos', {title: name});
});

//User Dashboard route
router.get('/dashboard', (req,res) => {
  const name = "Dashboard";
  console.log("Dashboard requested");
  res.render('dashboard', {title: name});
});

module.exports = router;
