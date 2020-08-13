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

//Contacto route
router.get('/contacto', (req, res) => {
  const name = "Contacto";
  console.log("Contacto requested");
  res.render('contacto', {title: name});
});

//Login route
router.get('/login', (req, res) => {
  const name = "Login";
  var errormsg;
  console.log("Login requested");
  var date = new Date();
  var year = date.getFullYear();
  console.log(req.cookies);
  if (req.cookies.error == true) {
    errormsg = "Correo o contraseña incorrectos";
  }
  res.clearCookie('error');
  res.render('login', {title: name, error: errormsg});

});

router.get('/protected', passport.authenticate('jwt', {session: false}), (req,res)=> {
  console.log(req.user);
  return res.json(req.user);

})


module.exports = router;
