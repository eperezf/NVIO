require('dotenv').config();
const express = require('express')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const aws = require("aws-sdk");
const app = express()
const port = process.env.PORT;
const mainRoutes = require('./routes/main');

//Check if DynamoDB is running at endpoint
aws.config.update({
  region: process.env.DBREGION,
  endpoint: process.env.ENDPOINT
})
var dynamodb = new aws.DynamoDB();
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

// app.listen(port, () =>{
//   console.log(`NVIO running @ ${port}`);
// });


//Set view engine and views route
app.set('view engine', 'pug')
app.set('views', './views')

//Set index routes
app.use('/', mainRoutes);


//Catch 404
app.use((req,res)=> {
  res.status(404).json({message: '404 - Not Found', status: 404});
});

//Error handling
app.use((error, req, res, next)=> {
  console.log(error);
  res.status(error.status || 500).json({error: error.message, status: 500});
});
