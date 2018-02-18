const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const salt = bcrypt.genSaltSync(10);

//ensure login
const ensureLogin = require("connect-ensure-login");

//passport
const passport = require("passport");


//facebook login
router.get("/auth/facebook", passport.authenticate("facebook", {scope: 'email'}));
router.get("/auth/facebook/callback", passport.authenticate("facebook", {
    successRedirect: "/private",
    failureRedirect: "/login"
}));
//facebook login

//google login

router.get("/auth/google", passport.authenticate("google", {
    scope: ["https://www.googleapis.com/auth/plus.login",
    "https://www.googleapis.com/auth/plus.profile.emails.read"]
}));

router.get("/auth/google/callback", passport.authenticate("google", {
    failureRedirect: "/",
    successRedirect: "/private"
}));

//google login

//private page
router.get("/private",
    ensureLogin.ensureLoggedIn(),
    (req, res)=>{

    console.log(req.user);
    res.render("private", {user:req.user});

});


//login
router.get("/login", (req,res)=>{
   res.render("auth/login", {"message":req.flash("error")});
});

router.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
    passReqToCallback: true
}));

//logout
router.get("/logout", (req,res)=>{
   req.logout();
   res.redirect("/login");
});


router.get("/signup", (req,res, next)=>{
    res.render("auth/signup");
})

.post("/signup", (req,res,next)=>{
    const username = req.body.username,
          password = req.body.password;
    if(username === "" || password === ""){
        res.render("auth/signup", {message: "Indicate username and password"});
        return;
    }

    User.findOne({username}, "username", (err, user)=>{
       if (user !== null){
           res.render("auth/signup", {message:"The username already exists"});
           return;
       }

       const hashPass = bcrypt.hashSync(password, salt);

       const newUser = new User({
          username,
          password:hashPass
       });

       newUser.save(err=>{
           if (err) return res.render("auth/signup", { message: "Something went wrong" });
            res.redirect("/");
       });

    });
});

module.exports = router;