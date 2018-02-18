var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const mongoose = require("mongoose");

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

//connect to database
mongoose.connect("mongodb://localhost:27017/pass");

//importacion de rutas
const authRouter = require("./routes/auth");

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//********************** facebook login ******************
//se subio el modelo para que las strategys compartan
const User = require("./models/User");
const passport = require("passport");

const FbStrategy = require('passport-facebook').Strategy;

passport.use(new FbStrategy({
    clientID: "399930830428662",
    clientSecret: "6019fb01f05fff0972ce65b6dbe25231",
    callbackURL: "/auth/facebook/callback",
    profileFields: ['email', "displayName"]
},
    (accessToken, refreshToken, profile, done)=>{
  User.findOne({facebookID:profile.id}, (err,user)=>{
      console.log(profile);
      if(err) return done(err);
      if(user) return done(null,user);
      const newUser = new User({
          facebookID:profile.id,
          displayName:profile.displayName,
          email:profile.emails.length > 0 ? profile.emails[0].value : null
      });
      newUser.save((err)=>{
        if(err) return done(err);
        done(null, newUser);
      });
    });
}));

//********************** facebook login ******************

//********************** Google login ********************

const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;

passport.use(new GoogleStrategy({
    clientID: "87733822528-p0ifpgrk6788cecitav9m1q20o5kp6sp.apps.googleusercontent.com",
    clientSecret: "TsK6Xb7sKc3ZTyxDWJC5cdFF",
    callbackURL: "/auth/google/callback"
},
    (accessToken, refreshToken, profile, done)=>{
        User.findOne({googleID: profile.id}, (err,user)=>{
            console.log(profile);
            if(err) return done(err);
            if(user) return done(null, user);
            const newUser = new User({
                googleID: profile.id,
                displayName:profile.displayName,
                email:profile.emails.length > 0 ? profile.emails[0].value : null
            });
            newUser.save(err=>{
                if (err) return done(err);
                done(null, newUser);
            });
        });
    }
    ));

//********************** Google login ********************



//********************************** passport ****************
//model
//movi la importacion del user par uqe las 2 estrategias lo puedan usar
//flash for errors
const flash = require("connect-flash");
//session

const session = require("express-session");
const bcrypt = require("bcrypt");
const LocalStrategy = require("passport-local");
//session middleware
app.use(session({
    secret: "bliss",
    resave: true,
    saveUninitializer: true
}));
//passport session
//before
passport.serializeUser((user,cb)=>{
  cb(null, user._id);
});

passport.deserializeUser((id, cb)=>{
  User.findOne({"_id":id}, (err,user)=>{
    if(err) return cb(err);
    cb(null, user);
  })
});

//flash
app.use(flash());

passport.use(new LocalStrategy({passReqToCallback:true},(req, username, password, next)=>{
  User.findOne({username}, (err, user)=>{
    if(err) return next(err);
    if(!user) return next(null, false, {message: "incorrect username"});
    if(!bcrypt.compareSync(password, user.password)) return next(null, false, {message: "Incorrecto password"});
    return next(null, user);
  });
}));

//after
app.use(passport.initialize());
app.use(passport.session());

//********************************** passport ****************


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//uso de rutas
app.use('/', index);
app.use('/users', users);
app.use("/", authRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
