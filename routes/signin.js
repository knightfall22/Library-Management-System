var sha1 = require('sha1');
var express = require('express');
var router = express.Router();

var UserModel = require('../models/users');
var checkNotLogin = require('../middlewares/check').checkNotLogin;

// GET /signin login page
router.get('/', checkNotLogin, function (req, res, next) {
    res.render('signin')
});

// POST /signin user login
router.post('/', checkNotLogin, function (req, res, next) {
    var id = req.fields.id;
    var password = req.fields.password;

    UserModel.getUserById(id)
        .then(function (user) {
            if (!id) {
                req.flash('error', 'User does not exist!');
                return res.redirect('back');
            }
            //Check if the password matches
            if (sha1(password) !== user.password) {
                req.flash('error', 'Wrong user name or password!');
                return res.redirect('back');
            }
            req.flash('success', 'Signin successful!');
            //User information is written to session
            delete user.password;
            req.session.user = user;
            // jump to the home page
            res.redirect('/home');
        })
        .catch(function(e) {
            req.flash('error', 'This user has not registered yet!');
            res.redirect('/signin');
            next(e)
        });
});


module.exports = router;