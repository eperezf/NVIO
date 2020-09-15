require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const aws = require("aws-sdk");
const app = express();
const port = process.env.PORT;
const { UI, createQueues } = require('bull-board');
const mainRoutes = require('./routes/main');
const authRoutes = require('./routes/auth');
const dashRoutes = require('./routes/dash');

//Configure AWS
aws.config.update({
  region: process.env.DBREGION,
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET
});

//Check if DynamoDB is running at endpoint
var dynamodbEndpoint = new aws.Endpoint(process.env.AWS_DYNAMODB_ENDPOINT);
var dynamodb = new aws.DynamoDB({endpoint:dynamodbEndpoint});
console.log("Waiting for database...");
//List the tables in the DB
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

//Configure Redis
const redisConfig = {
  redis: {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_URL,
    auth: null
  },
}
//Setup queues
const queues = createQueues(redisConfig);


// Create Excel Redis queue
console.log("Connecting to Redis");
excelQueue = queues.add(
  'excelQueue',
  {
    redis: {port: process.env.REDIS_PORT, host: process.env.REDIS_URL},
    limiter: {max: 1,duration: 2000}
  }
)

excelQueue.process('excelJob',__dirname+'/jobs/excelJob.js');

//Use cookieParser
app.use(cookieParser());

//Require Passport
require('./passport');


//Set view engine and views route
app.set('view engine', 'pug');
app.set('views', './views');

//Prevents to check previous page after logout
app.use(function (req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next()
});

//Set index routes
app.use('/', mainRoutes);
app.use('/', authRoutes);
app.use('/dashboard/', dashRoutes);
app.use('/admin/queues', UI);

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
