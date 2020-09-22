require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const aws = require("aws-sdk");
const app = express();
const port = process.env.PORT;
const { UI, createQueues } = require('bull-board');
const Queue = require('bull');
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
// Create Excel Redis queue
const excelQueue = new Queue(
  'excelQueue',
  {
    redisConfig,
    limiter: {max: 2,duration: 500}
  }
);
excelQueue.process('excelJob',__dirname+'/jobs/excelJob.js');

//Setup queues for Bull
const queues = createQueues(redisConfig);
const excelQueueBoard = queues.add('excelQueue', {redis: {port: process.env.REDIS_PORT, host: process.env.REDIS_URL}});
console.log("Connecting to Redis");

//Use cookieParser
app.use(cookieParser());

//Require Passport
require('./passport');

//Set view engine and views route
app.set('view engine', 'pug');
app.set('views', './views');

//Use JSON parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
