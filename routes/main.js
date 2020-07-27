const express = require('express');
const passport = require('passport');
const router = express.Router();

//Index route
router.get('/', (req, res) => {
  console.log("Index requested");
  res.render('index');
});

module.exports = router;
