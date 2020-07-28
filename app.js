require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT;

app.set('view engine', 'pug')
app.set('views', './views')

const mainRoutes = require('./routes/main');

//Setup router
app.use('/', mainRoutes);

//Static content pathing
app.use(express.static('public'))

//Catch 404
app.use((req,res)=> {
  res.status(404).render('404', {year: 2020, title: "NVIO"});
});

//Error handling
app.use((error, req, res, next)=> {
  console.log(error);
  res.status(error.status || 500).json({error: error.message, status: 500});
});

app.listen(port, () =>{
  console.log(`NVIO running @ ${port}`);
});
