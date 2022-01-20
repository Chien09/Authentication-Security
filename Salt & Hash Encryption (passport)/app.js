/* 
Creating a web application Secret in implementing authentication (accounts) & security to access Secrets page, similar to 
the Whisper Application. Users are able to register, login, and able to access the secret page, but only able to add One Secret.  
for this version. 
Using the MongoDB for storing accounts. 
Using passport, cookies (Salt & Hashing) for securing passwords.

-Install npm --> npm init
-Install Express, EJS, body-parser --> npm i express ejs body-parser 
-Install Mongoose --> npm i mongoose 

-Run the server and access the web application on web browser--> localhost:3000

-Use Salt & Hashing encrpytion using passport, essentially adding Salt (random strings) to password before hashing. You can have more "Salt Rounds", meaning
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
*/

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

//express-session
const session = require("express-session"); 

//passport & passport-local-mongoose (Do not need to require("passport-local") will be used by "passport-local-mongoose")
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose"); 

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
    password: String
}); 

//add the pulgin passportLocalMongoose for adding Salt and hashing user passwords and storing it to MongoDB 
userSchema.plugin(passportLocalMongoose); 

//create model collection based on userSchema requirments 
const User = new mongoose.model("User", userSchema); 

//createStrategy is responsible to setup passport-local LocalStrategy with the correct options
passport.use(User.createStrategy());

//Serialize User information into Cookie, Deserialize User from Cookie to look inside the information in the cookie
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

//if code above doesn't work use these, will work with any strategy 
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

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
    if(request.isAuthenticated()){
        response.render("secrets"); 
    } else{
        response.redirect("/login");
    }
    
}); 

app.get("/logout", function(request, response){
    request.logOut();
    response.redirect("/");  
});

//press submit a secret button 
app.get("/submit", function(request, response){
    response.render("submit"); 
}); 

//submit button to add to the secret page content 
app.post("/submit", function(request, response){
    const submittedSecret = request.body.secret; 

    response.render("secrets", {newSecret: submittedSecret}); 
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