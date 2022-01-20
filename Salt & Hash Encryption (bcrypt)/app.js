/* 
Creating a web application Secret in implementing authentication (accounts) & security to access Secrets page, similar to 
the Whisper Application. Users are able to register, login, and able to access the secret page, but only able to add One Secret.  
for this version. 
Using the MongoDB for storing accounts. 
Using bcrypt (Salt % Hashing) for securing passwords.

-Install npm --> npm init
-Install Express, EJS, body-parser --> npm i express ejs body-parser 
-Install Mongoose --> npm i mongoose 

-Run the server and access the web application on web browser--> localhost:3000

-Use Salt & Hashing encrpytion bcrypt, essentially adding Salt (random strings) to password before hashing. You can have more "Salt Rounds", meaning
adding another salt to the first hash result and more after that keep repeating to make password more secure. 
install --> npm i bcrypt@<version>
IMPORTANT! Make sure to install the correct bcrypt version to match your node.js version, check the reference link
to see which version to match. As currently my node.js version is v16.13.1 so I would have to use 
bcrypt version 3.0.6, but there is problem with installing so bcrypt version 5.0.1 works. 
YOU can also change or update your current node.js version by installing "nvm" through command line 
Reference bcrypt --> https://www.npmjs.com/package/bcrypt 
Reference nvm --> https://blog.logrocket.com/how-switch-node-js-versions-nvm/

*/

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

//bcrypt encrpytion for salt and hashing 
const bcrypt = require('bcrypt');
const saltRounds = 10; 

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

    //apply salt and hashing to password
    bcrypt.hash(request.body.password, saltRounds, function(err, hash) {

        const newUser = new User({
            email: request.body.username,
            password: hash
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

});

app.post("/login", function(request, response){
    const userName = request.body.username;
    const userPassword = request.body.password;

    User.findOne({email: userName}, function(err, foundUser){
        if(err){
            response.send(err);
        } else{
            if(foundUser){
                // using salt and hashing to input password and compare the hash to the one in DB 
                bcrypt.compare(userPassword, foundUser.password, function(err, result) {
                    if(result === true){ //userPassword === foundUser.password
                        response.render("secrets");
                    } else{
                        //wrong password
                        response.redirect("/login"); 
                    }
                });
            } else{
                //foundUser === false 
                response.redirect("/login"); 
            }
        }
    }); 

});