const express = require('express');
const router  = express.Router();
var multer  = require('multer');
var upload = multer();

const jwt = require('jsonwebtoken');
const passport = require("passport");

router.post('/login', upload.none(), function (req, res, next) {
  var maxAge = 86400000;
  var expiresIn = "1d";
  console.log("Login POST requested");
  console.log(req.body);
  if (req.body.remember_me) {
    console.log("Remember Me activated");
    maxAge = 2629746000;
    expiresIn = "1m";
  }

  //Passport Authentication
  passport.authenticate('local', {session: false}, (err, user, info) => {
    if (err || !user) {
      console.log("Redirecting back to login screen");
      res.cookie('error', true);
      return res.redirect('/login');
    }
    req.login(user, {session: false}, (err) => {
      if (err) {
        res.send(err);
      }
      const token = jwt.sign({user, iat: Math.floor(Date.now()/1000)}, process.env.JWT_SECRET, {expiresIn: expiresIn, });
      res.cookie('token', token, {maxAge: maxAge, secure: false, httpOnly: true,});
      if (user.includes("ADMIN")){
        return res.redirect('/');
      }
      else if (user.includes("DRIVER")) {
        return res.redirect('/');
      }
      else {
        return res.redirect('/dashboard');
      }
    });
  })(req, res);
});

router.get('/logout', (req, res, next) => {
  res.clearCookie('token');
  return res.redirect('/login');
})

module.exports = router;
