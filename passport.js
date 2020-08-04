const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const saltRounds = 10;

const passportJWT = require("passport-jwt");
const JWTStrategy   = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

//AWS Settings
var aws = require("aws-sdk");
aws.config.update({
  region: process.env.DBREGION,
  endpoint: process.env.ENDPOINT
});
var docClient = new aws.DynamoDB();


passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
function (email, password, cb) {
  console.log("====STARTED PASSPORT AUTH====");
  console.log(email);
  console.log(password);
  var userID;
  var profileID;
  var hashedPassword;

  var params = {
    "TableName": "NVIO",
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": {"S":"EMAIL"},":cd421": {"S":"EMAIL#" + email}}
  };
  docClient.query(params, function(err, data) {
    if (err) {
        console.error("Unable to query. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log("Email Query succeeded.");
      if (data.Count == 0) {
        console.log("User does not exist.");
        return cb(null, false, {message: 'Incorrect email or password.'});
      }
      data.Items.forEach(function(item) {
        userID = item.userID.S;
        console.log("userID is: " + userID);
        if (userID.includes("ADMIN")){
          profileID = userID.replace("ADMIN", "PROFILE");
        }
        else if (userID.includes("DRIVER")) {
          profileID = userID.replace("DRIVER", "PROFILE");
        }
        else {
          profileID = userID.replace("COMPANY", "PROFILE");
        }
        console.log("User is " + userID);
        params = {
          "TableName": "NVIO",
          "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
          "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
          "ExpressionAttributeValues": {":cd420": {"S": userID},":cd421": {"S": profileID}}
        }
        docClient.query(params, function(err, data) {
          console.log("Looking for profile " + profileID);
          if (err) {
              console.error("Unable to query. Error JSON:", JSON.stringify(err, null, 2));
          } else {
            console.log("Profile Query succeeded.");
            console.log("Hashed Password is " + data.Items[0].password.S);
            hashedPassword = data.Items[0].password.S;
            bcrypt.compare(password, hashedPassword, function(err, result) {
              console.log("Comparing password with hash.");
              if (err) {
                console.log("Error");
                return cb(null, false, {message: 'An error occured processing the request.'});
              }
              if (result) {
                console.log("Password OK");
                return cb(null, userID, {message: 'Logged In Successfully'});
              }
              else {
                console.log("Password Not OK.");
                return cb(null, false, {message: 'Incorrect email or password.'});
              }
            });
          }
        });
      });
    }
  });
}));

var cookieExtractor = function(req) {
    var token = null;
    if (req && req.cookies)
    {
      token = req.cookies['token'];
    }
    return token;
};

passport.use(new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
        secretOrKey   : process.env.JWT_SECRET
    },
    function (jwtPayload, cb) {
      //console.log(jwtPayload);
      return cb(null, jwtPayload, {message: 'Logged In Successfully'});
    }
));
