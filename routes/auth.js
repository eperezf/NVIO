const express = require('express');
const router  = express.Router();
var multer  = require('multer');
var upload = multer();

router.post('/login', upload.none(), function (req, res) {
  console.log("Login POST requested");
  console.log(req.body);
  res.status(200).json(req.body);
});

module.exports = router;
