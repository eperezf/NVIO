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
