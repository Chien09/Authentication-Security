/* 
Creating a web application Secret in implementing authentication (accounts) & security to access Secrets page, similar to 
the Whisper Application. Users are able to register, login, and able to access the secret page, but only able to add One Secret.  
for this version. 
Using the MongoDB for storing accounts. 
Using MD5 hashing for securing passwords.

-Install npm --> npm init
-Install Express, EJS, body-parser --> npm i express ejs body-parser 
-Install Mongoose --> npm i mongoose 

-Run the server and access the web application on web browser--> localhost:3000

-Use Hashing encrpytion MD5 (Better than using Mongoose-Encryption SECRET), install --> npm i md5
Simply hash message by --> md5(message)
NOTE: hashing the same string or message the resulting hash will be the same, so we are storing 
the hash into the DB as password, NOT the password itself. It is almost impossible to revert the hash 
back to the password.
Reference MD5--> https://www.npmjs.com/package/md5

*/

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

//Hashing encrpytion
const md5 = require("md5"); 

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const mongoose = require("mongoose"); 

//connect to local mongoDB
mongoose.connect('mongodb://localhost:27017/userDB');

//create schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
}); 

//create model collection based on userSchema requirments 
const User = new mongoose.model("User", userSchema); 

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

app.get("/logout", function(request, response){
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

    const newUser = new User({
        email: request.body.username,
        password: md5(request.body.password) //hashing password with md5 
    });

    //save to DB
    newUser.save(function(err){
        if(!err){
            response.render("secrets"); 
        } else{
            response.send(err); 
        }
    }); 

});

app.post("/login", function(request, response){
    const userName = request.body.username;
    const userPassword = md5(request.body.password); //hashing password with md5 to compare with hash in DB

    User.findOne({email: userName}, function(err, foundUser){
        if(err){
            response.send(err);
        } else{
            if(foundUser){
                if(foundUser.password === userPassword){
                    response.render("secrets");
                } else {
                    //wrong password
                    response.redirect("/login"); 
                }
            } else{
                //foundUser === false 
                response.redirect("/login"); 
            }
        }
    }); 

});