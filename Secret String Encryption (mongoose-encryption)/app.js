/* 
Creating a web application Secret in implementing authentication (accounts) & security to access Secrets page, similar to 
the Whisper Application. Users are able to register, login, and able to access the secret page, but only able to add One Secret.  
for this version. 
Using the MongoDB for storing accounts. 
Using Secret encryption using Mongoose-Encryption for securing passwords.

-Install npm --> npm init
-Install Express, EJS, body-parser --> npm i express ejs body-parser 
-Install Mongoose --> npm i mongoose 

-Run the server and access the web application on web browser--> localhost:3000

-Use "Mongoose-encryption" for the password install --> npm i mongoose-encryption
Will be using the "Secret String Instead of Two Keys" & "Encrypt Only Certain Fields" encryption, located in the reference link 
Reference mongoose encryptiong--> https://www.npmjs.com/package/mongoose-encryption

-Using "dotenv" enviornment variable to keep our SECRET string safe, install --> npm i dotenv
NEED to create a file ".env" to store the SECRET or other important Keys like API Key using command --> touch .env
IMPORTANT!!!! DO NOT upload ".env" to respository, need to include it in ".gitignore" file
Reference dotenv --> https://www.npmjs.com/package/dotenv

*/

//Enviornment variable to store SECRET for encrpytion, this code must be on the very top 
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

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

//Mongoose Encryption 
const encrypt = require("mongoose-encryption"); 
//const secret = "Thisissecretencryption"; //this secret will be stored in .env for security 
//console.log(process.env.SECRET); //log the SECRET from the .env to make sure it is working

//this add on plugin code must be before create User model code below, it will ONLY encrpyt password field
//Essentially, it will encrpyt on save() and then decrpyt on find(),so password stored in DB will be encrypt
//Note: Secret is stored in ".env" file 
userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] }); 

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
        password: request.body.password
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
    const userPassword = request.body.password;

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