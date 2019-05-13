var express = require('express');
var router = express.Router();

var checkLogin = require('../middlewares/check').checkLogin;

// GET /signout logout
router.get('/', checkLogin, function (req, res, next) {
    //Clear the user information in the session
    req.session.user = null;
    req.flash('success', 'Sign out successfully!');
    // Jump to the home page after successful login
    res.redirect('/home');
});

module.exports = router;