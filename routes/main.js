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
  res.render('quienes-somos', {year: year, title: "NVIO | Quienes Somos"});
});

//login route
router.get('/login', (req, res) => {
  var errormsg;
  console.log("Login requested");
  var date = new Date();
  var year = date.getFullYear();
  console.log(req.cookies);
  if (req.cookies.error == true) {
    errormsg = "Correo o contraseña incorrectos";
  }
  res.render('login', {title: "NVIO | Login", error: errormsg});

});

router.get('/protected', passport.authenticate('jwt', {session: false}), (req,res)=> {
  console.log(req.user);
  return res.json(req.user);

})


module.exports = router;
