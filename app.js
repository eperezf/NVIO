require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const aws = require("aws-sdk");
const app = express();
const port = process.env.PORT;
const mainRoutes = require('./routes/main');
const authRoutes = require('./routes/auth');
const dashRoutes = require('./routes/dash');

//Check if DynamoDB is running at endpoint
aws.config.update({
  region: process.env.DBREGION,
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET
});
var dynamodbEndpoint = new aws.Endpoint(process.env.AWS_DYNAMODB_ENDPOINT);
var dynamodb = new aws.DynamoDB({endpoint:dynamodbEndpoint});
console.log("Waiting for database...");
dynamodb.listTables((err, data)=>{
  if (err) {
    console.log("DB connection ERROR:");
    console.log(err);
  }
  else {
    console.log("DB connection OK. Here's a list of the tables:");
    console.log(data);
    //Listen to requests at port
    app.listen(port, () =>{
      console.log(`NVIO running @ ${port}`);
    });
  }

});

//Use cookieParser
app.use(cookieParser());

//Require Passport
require('./passport');


//Set view engine and views route
app.set('view engine', 'pug');
app.set('views', './views');

//Set index routes
app.use('/', mainRoutes);
app.use('/', authRoutes);
app.use('/dashboard/', dashRoutes);

//Static content pathing
app.use(express.static('public'));

//Catch 404
app.use((req,res)=> {
  res.status(404).render('404', { title: "404"});
});

//Error handling
app.use((error, req, res, next)=> {
  console.log(error);
  res.status(error.status || 500).json({error: error.message, status: 500});
});
