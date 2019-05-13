var fs = require('fs');
var path = require('path');
var sha1 = require('sha1');
var express = require('express');
var router = express.Router();

var UserModel = require('../models/users');
var checkNotLogin = require('../middlewares/check').checkNotLogin;
var checkIsAdmin = require('../middlewares/check').checkIsAdmin;

//GET /signup registration page
router.get('/', function (req, res, next) {
    res.render('signup');
});

//POST /signup user registration
router.post('/', checkIsAdmin, function (req, res, next) {
    var userData = {
        id: req.fields.id,
        name: req.fields.name,
        gender: req.fields.gender,
        bio: req.fields.bio,
        password: req.fields.password,
        repassword: req.fields.repassword
    }
    //check the parameters
    try {
        if (userData.password !== userData.repassword) {
            throw new Error('Inconsistent input password twice ');
        }
    } catch (e) {
        //registration failed, delete the uploaded avatar asynchronously
        req.flash('error', e.message);
        return res.redirect('/signup');
    }

    //Clear text password encryption
    userData.password = sha1(userData.password);

    //User information to be written to the database
    var user = {
        id: userData.id,
        name: userData.name,
        password: userData.password,
        gender: userData.gender,
        bio: userData.bio,
        isAdmin: false
    };
    //User information is written to the database
    UserModel.create(user)
        .then(function (result) {
            //This user is the value after inserting mongodb, containing _id
            user = result.ops[0];
            //Save user information into the session 
            delete user.password;
            //req.session.user = user;
            //write to flash 
            req.flash('success', 'Registration success');
            //jump to the home page 
            res.redirect('/home');
        })
        .catch(function (e) {
            //registration failed, delete the uploaded avatar asynchronously 
            
            //The username is taken back to the registration page instead of the error page 
            if (e.message.match('E11000 duplicate key')) {
                req.flash('error', 'This Student\'s ID has been used, please try another one!');
                return res.redirect('/signup');
            }
            next(e);
        });
});

module.exports = router;