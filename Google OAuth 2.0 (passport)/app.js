/* 
Creating a web application Secret in implementing authentication (accounts) & security to access Secrets page, similar to 
the Whisper Application. Users are able to register, login or login through Google Account, and able to access the secret page
and also add their own secret. 
Using the MongoDB for storing accounts. 
Using Google OAuth third party security to authenticate instead of implementing our own. 

-Install npm --> npm init
-Install Express, EJS, body-parser --> npm i express ejs body-parser 
-Install Mongoose --> npm i mongoose 

-Run the server and access the web application on web browser--> localhost:3000

-Use Salt & Hashing encrpytion bcrypt, essentially adding Salt (random strings) to password before hashing. You can have more "Salt Rounds", meaning
adding another salt to the first hash result and more after that keep repeating to make password more secure. 
Will be using passport-local-mongoose to do the Salt and hashing on user passwords and store it in MongoDB

-To authenticate a user login in Session we need to implement Cookies through installing "Passport" 
All packages needed for Passport:
install passport --> npm i passport
install passport-local --> npm i passport-local
install passport-local-mongoose --> npm i passport-local-mongoose
install express-session --> npm i express-session 

passport-local-mongoose is to use it for Salt and hashing user password and store in MongoDB 

Reference passport --> http://www.passportjs.org 
Reference express-session --> https://www.npmjs.com/package/express-session

-Now whenever a user registers or logins in a session will be created and a cookie will be stored, can check Cookies in
web browser under the name localhost. Cookie will be deleted once logged out and expire due to settings and 
therefore will need to login in again to access the "/secrets" page

-Using "dotenv" enviornment variable to keep our Keys or IDs string safe, install --> npm i dotenv
NEED to create a file ".env" to store the SECRET or other important Keys like API Key using command --> touch .env
IMPORTANT!!!! DO NOT upload ".env" to respository, need to include it in ".gitignore" onece you have created the ".gitignore" file
Reference dotenv --> https://www.npmjs.com/package/dotenv

-OAuth --> will be using third party authentication such as login in using Facebook or Gmail so we 
don't have to implement our own authentication, makes life easier. Once the user has logged in 
an "Authentication Code" will be passed from third party to verify that the user has signed in. We 
can also get a "Access Token" which we can store in our own DB. 
    Authentication Code --> one time use 
    Access Token --> long term use like a year pass 

Will be using Google's OAuth install --> npm install passport-google-oauth20

Must register an application with Google Developer Console in order to use it --> https://console.cloud.google.com/apis/dashboard
+Create a new Project in the Google Developer Console 
+Configure the OAuth consent screen in "Credentials" then select External use
+Create OAuth clientID in "Credentials"
+In "Authorized JavaScript origins" make sure to include your website in this project's case "http://localhost:3000"
+In "Authorized redirect URIs" redirects once user has been authenticated by Google in this project's case "http://localhost:3000/auth/google/secrets"
+Save both "OAuth Client ID" & "Client secret" into .env file 
Reference Google's Oauth20 --> http://www.passportjs.org/packages/passport-google-oauth20/

-More styling to Social buttons like Goolge --> https://lipis.github.io/bootstrap-social/
Grab the file "bootstrap-social.css" and put it into --> public > css 
Include the <link> tag in the header.ejs 
Add the class "btn-social btn-google" to the <a></a> tag in register.ejs and login.ejs

*/

//Enviornment variable to store Keys, this code must be on the very top, allows access to .env file
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

//express-session
const session = require("express-session"); 

//passport & passport-local-mongoose (Do not need to require("passport-local") will be used by "passport-local-mongoose")
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose"); 

//Google OAuth 
const GoogleStrategy = require('passport-google-oauth20').Strategy;

//mongoose-findorcreate 
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Session config code must be between mongoose and above code 
app.use(session({
    secret: "Our little secret",
    resave: false,
    saveUninitialized: false
}));

//Use initialize passport and use passport to deal with session
app.use(passport.initialize()); 
app.use(passport.session()); 

const mongoose = require("mongoose"); 

//connect to local mongoDB
mongoose.connect('mongodb://localhost:27017/userDB');

//create schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String   
}); 

//add the plugin passportLocalMongoose for adding Salt and hashing user passwords and storing it to MongoDB 
userSchema.plugin(passportLocalMongoose); 

//add the plugin mongoose-findorcreate 
userSchema.plugin(findOrCreate); 

//create model collection based on userSchema requirments 
const User = new mongoose.model("User", userSchema); 

//createStrategy is responsible to setup passport-local LocalStrategy with the correct options
passport.use(User.createStrategy());

//Serialize User information into Cookie, Deserialize User from Cookie to look inside the information in the cookie
//passport.serializeUser(User.serializeUser());
//passport.deserializeUser(User.deserializeUser());

//if code above doesn't work use these, will work with any strategy 
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

//config GoogleStrategy, to access Google and notify our Web App
//Code must be below code above
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"  //this has to be the same as your "Authorized redirect URIs" when creating Credentials
  },
  function(accessToken, refreshToken, profile, cb) { //the accessToken where we have access to the user, Profile contains google ID and other information 
    //console.log(profile); //information about user Google Account

    //find or create to DB
    User.findOrCreate({ googleId: profile.id }, function (err, user) { //need to install mongoose-findorcreate for this "findorcreate()" method to work and require("mongoose-findorcreate") https://www.npmjs.com/package/mongoose-findorcreate
      return cb(err, user);
    });
  }
));

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

app.get("/", function(request, response){
    response.render("home"); 
}); 

app.get("/login", function(request, response){
    response.render("login"); 
}); 

app.get("/register", function(request, response){
    response.render("register"); 
}); 

app.get("/secrets", function(request, response){
    //$ne --> not equal to 
    //finding all users in DB with secret field not null, because not every user has secret
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
        if(err){
            console.log(err); 
        } else{
            if(foundUsers){
                response.render("secrets", {usersWithSecret: foundUsers}); //passing array of users with secrets 
            }
        }
    });
}); 

//press submit a secret button 
app.get("/submit", function(request, response){
    if(request.isAuthenticated()){
        response.render("submit"); 
    } else{
        response.redirect("/login");
    }
}); 

//submit button to add the secret to User's DB
app.post("/submit", function(request, response){
    const submittedSecret = request.body.secret; 

    User.findById(request.user.id, function(err, foundUser){
        if(err){
            console.log(err);
        } else{
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    response.redirect("/secrets"); 
                }); 
            }
        }
    });
});

app.get("/logout", function(request, response){
    request.logOut();
    response.redirect("/");  
});

//for the Google OAuth Button, direct to Google account sign in
//profile we need to get the user ID and email of Google Account
app.get("/auth/google", passport.authenticate('google', { scope: ["profile"] })); 

//redirect after Login in to Google Account
app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets page.
    res.redirect("/secrets");
  });

app.post("/register", function(request, response){

    //register() comes from passport-local-mongoose package 
    //will handle all the storing DB and aunthenticating user 
    User.register({username: request.body.username}, request.body.password, function(err, user){
        if(err){
            console.log(err);
            response.redirect("/register"); 
        } else{
            //use passport to authenticate user 
            passport.authenticate("local")(request, response, function(){
                response.redirect("/secrets"); 
            });
        }
    });

});

app.post("/login", function(request, response){
    const user = new User({
        email: request.body.username,
        password: request.body.password
    });

    request.login(user, function(err){
        if(err){
            console.log(err);
        } else {
            //use passport to authenticate user login 
            passport.authenticate("local", {failureRedirect: "/login"})(request, response, function(){
                response.redirect("/secrets"); 
            }); 
        }
    });

});