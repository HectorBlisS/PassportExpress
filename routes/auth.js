const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Room = require("../models/Room");
const bcrypt = require("bcrypt");
const salt = bcrypt.genSaltSync(10);

//check roles
const checkGuest  = checkRoles('GUEST');
const checkEditor = checkRoles('EDITOR');
const checkAdmin  = checkRoles('ADMIN');

//ensure login
const ensureLogin = require("connect-ensure-login");

//passport
const passport = require("passport");


//security by roles
//new room
router.get("/rooms/new", (req,res, next)=>{
   res.render("rooms/new_form");
});

router.post("/rooms/new", ensureAuthenticated, (req,res,next)=>{
   const newRoom = new Room({
       name: req.body.name,
       desc: req.body.desc,
       owner: req.user._id // adding the user id
   });
   newRoom.save(err=>{
       if (err) return next(err);
       res.redirect("/rooms");
   });
});
//own rooms
router.get("/rooms", ensureAuthenticated, (req,res,next)=>{
   Room.find({owner: req.user._id}, (err, rooms)=>{
       if(err) return next(err);
       res.render("rooms/index", {rooms});
   }) ;
});

//role security
router.get("/private", checkRoles("ADMIN"), (req, res)=>{
    res.render("private", {user:req.user});
});


//private routes
//private page
router.get("/private",
    ensureLogin.ensureLoggedIn(),
    (req, res)=>{

        console.log(req.user);
        res.render("private", {user:req.user});

    });

router.get("/private2", ensureAuthenticated, (req,res)=>{
   res.render("private", {user:req.user});
});

//******************** handcrafted middlewares ************
//middleware for ensure login
function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated()) return next();
    res.redirect("/login");
}
//middleware for ensure role
function checkRoles(role){
    return function(req, res,next){
        if(req.isAuthenticated() && req.user.role === role){
            return next();
        }else{
            res.redirect("/login");
        }
    }
}



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