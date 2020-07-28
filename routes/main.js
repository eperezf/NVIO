const express = require('express');
const passport = require('passport');
const router = express.Router();

//Index route
router.get('/', (req, res) => {
  console.log("Index requested");
  var date = new Date();
  var year = date.getFullYear();
  res.render('index', {title: "NVIO"});
});

module.exports = router;
