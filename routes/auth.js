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
      console.log("Redirecting back to login screen");
      res.cookie('error', true);
      return res.redirect('/login');
    }
    req.login(user, {session: false}, (err) => {
      if (err) {
        res.send(err);
      }
      const token = jwt.sign(user, process.env.JWT_SECRET);
      res.cookie('token', token, {maxAge: 65876587658, secure: false, httpOnly: true,});
      return res.json({user, token});
    });
  })(req, res);
});

router.get('/logout', (req, res, next) => {
  res.clearCookie('token');
  return res.redirect('/login');
})

module.exports = router;
