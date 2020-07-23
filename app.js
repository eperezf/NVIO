const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const port = 3000

//ipdate epxress settings
app.use(bodyParser.urlencoded({extended: false})); //parse application/x-www-form-urlencoded
app.use(bodyParser.json()); //parse application/json

app.get('/', (req, res) => {
  console.log("hi");
  res.send('Hello World!');
});

app.get('/status', (req, res) => {
  res.status(200).json({message:'ok', status: 200});
});

app.get('/test', (req, res) => {
  res.send('test');
});

app.post('/signup', (req, res, next) =>{
  console.log(req.body) ;
  if (!req.body) {
    res.status(400).json({message:'invalid body', status: 400});
  }
  else {
    res.status(200).json({message:'ok', status: 200});
  }
});

app.post('/login', (req, res) =>{
  res.status(200).json({message:'ok', status: 200});
});

app.post('/logout', (req, res) =>{
  res.status(200).json({message:'ok', status: 200});
});

app.post('/token', (req, res) =>{
  console.log(req.body) ;
  if (!req.body || !req.body.refreshToken) {
    res.status(400).json({message:'invalid body', status: 400});
  }
  else {
    const {refreshToken} = req.body;
    res.status(200).json({message:`Refresh token req. for token ${refreshToken}`, status: 200});
  }
});

app.post('/forgot-password', (req, res) =>{
  res.status(200).json({message:'ok', status: 200});
});

app.post('/reset-password', (req, res) =>{
  res.status(200).json({message:'ok', status: 200});
});

//catch other routes
app.use((req,res)=> {
  res.status(404).json({message: '404 - Not Found', status: 404});
});

//handle errors
app.use((error, req, res, next)=> {
  console.log(error);
  res.status(error.status || 500).json({error: error.message, status: 500});
});

app.listen(port, () =>{
  console.log(`Example app listening at http://localhost:${port}`);
});
