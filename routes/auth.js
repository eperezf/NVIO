const express = require('express');
const router  = express.Router();
var multer  = require('multer');
var upload = multer();

const jwt = require('jsonwebtoken');
const passport = require("passport");

router.post('/login', upload.none(), function (req, res, next) {
  console.log("Login POST requested");
  console.log(req.body);

  //Passport Authentication
  passport.authenticate('local', {session: false}, (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        message: 'Something is not right',
        user   : user
      });
    }

    req.login(user, {session: false}, (err) => {
      if (err) {
        res.send(err);
      }
      // generate a signed son web token with the contents of user object and return it in the response
      const token = jwt.sign(user, 'your_jwt_secret');
      return res.json({user, token});
    });
  })(req, res);
});

module.exports = router;
