var fs = require('fs');
var path = require('path');
var express = require('express');
var router = express.Router();

var LibraryModel = require('../models/library');
var BorrowBookModel = require('../models/borrowBooks');
var UserModel = require('../models/users');
var checkLogin = require('../middlewares/check').checkLogin;
var checkIsAdmin = require('../middlewares/check').checkIsAdmin;

router.get('/', checkIsAdmin, async function (req, res, next) {
    var admin = req.query.admin;
    
    try {
        var books = await LibraryModel.getBooks(admin);
        books.forEach(async function(book) {
            try {
                var borrowCount = await BorrowBookModel.getBorrowBooksCount(book._id);
                book.borrowCount = borrowCount;
            } catch (error) {
                req.flash('error', 'Something go wrong, please try again!');
            }
        }, this);

        setTimeout(() => {
            res.render('library', {
                books: books
            });
        }, 1000)
    } catch (error) {
        req.flash('error', 'Something go wrong, please try again!');
        next();
    }

});

// POST  Add Book
router.post('/', checkIsAdmin, async function (req, res, next) {
    var admin = req.session.user._id;

    var bookData = {
        admin: req.session.user._id,
        name: req.fields.name,
        location: req.fields.location,
        author: req.fields.author,
        press: req.fields.press,
        inventory: parseInt(req.fields.inventory),
        date: req.fields.date,
        score: parseInt(req.fields.score),
        cover: req.fields.cover_url || req.files.cover.path.split(path.sep).pop() ,
        introduction: req.fields.introduction
    }
    //check the parameters
    try {
        if (!bookData.name.length) {
            throw new Error('Please fill in the name!');
        }
        if (!bookData.introduction.length) {
            throw new Error('Please fill in the introduction!');
        }
    } catch (e) {
        req.flash('error', e.message);
        return res.redirect('back');
    }

    var realName = bookData.name + '(' + bookData.location +')';

    var book = {
        admin: bookData.admin,
        name: realName,
        author: bookData.author,
        press: bookData.press,
        inventory: bookData.inventory,
        date: bookData.date,
        score: bookData.score,
        cover: bookData.cover,
        introduction: bookData.introduction,
        pv: 0
    };
    
    var checkBook = await LibraryModel.checkBook(book.name);

    if (!checkBook.length) {
        LibraryModel.create(book)
        .then(function (result) {
            //This post is the value after inserting mongodb, containing _id
            book = result.ops[0];
            req.flash('success', 'Add successfully!');
            //After the success, jump to
            res.redirect(`/library`);
        })
        .catch(next);
    } else {
        req.flash('error', 'This book has already exist!');
        res.redirect(`/library`);
    }
    
});

//GET /library/:bookId separate book 
router.get('/:bookId', function (req, res, next) {
    var bookId = req.params.bookId;

    Promise.all([
        LibraryModel.getBookById(bookId), //Get article information
        LibraryModel.incPv(bookId)// pv plus 1
    ])
        .then(function (result) {
            var book = result[0];
            if (!book) {
                throw new Error('The book does not exist!');
            }
            book.location = book.name.slice(-7, -1);
            res.render('book', {
                book: book
            });
        })
        .catch(next);
});

// GET /library/:bookId/remove remove book
router.get('/:bookId/remove', checkIsAdmin, function (req, res, next) {
    var bookId = req.params.bookId;
    var admin = req.session.user._id;

    LibraryModel.delBookById(bookId, admin)
        .then(function () {
            req.flash('success', 'Delete the book successfully!');
            //Jump to the home page after the deletion is successful
            res.redirect('/library');
        })
        .catch(next);
});

// POST /library/:bookId/edit edit book
router.post('/:bookId/edit', checkIsAdmin, function (req, res, next) {
    var bookId = req.params.bookId;
    var admin = req.session.user._id;
    
    var bookData = {
        name: req.fields.name,
        author: req.fields.author,
        press: req.fields.press,
        inventory: parseInt(req.fields.inventory),
        date: req.fields.date,
        score: parseInt(req.fields.score),
        introduction: req.fields.introduction
    };

    LibraryModel.updateBookById(bookId, admin, bookData)
        .then(function () {
            req.flash('success', 'Edit book success!');
            //Jump to the previous page after successful editing
            res.redirect(`/library`);
        })
        .catch(next);
});


// POST borrowing books
router.get('/:bookId/borrow', checkIsAdmin, async function (req, res, next) {
    var userId = req.session.user._id;
    var bookId = req.params.bookId;
    
    var borrow = {
        userId: userId,
        bookId: bookId
    };
    try {
        var book = await LibraryModel.getRawBookById(borrow.bookId);
        if (book.inventory >= 1) {
            try {
                await LibraryModel.updateBookById(borrow.bookId, '59dcc048234ad64c210a7bae', {
                    inventory: book.inventory - 1
                })
                try {
                    await BorrowBookModel.create(borrow)
                    req.flash('success', 'Borrow Successfully!');
                    res.redirect('back');
                } catch (error) {
                    req.flash('error', 'Something go wrong, please try again!');
                    res.redirect('back');
                }
            } catch (error) {
                req.flash('error', 'Something go wrong, please try again!');
                res.redirect('back');
            }
            
        } else {
            req.flash('error', 'Zero inventory!');
            res.redirect('back');
        }
    } catch (error) {
        req.flash('error', 'Something go wrong, please try again!');
        res.redirect('back');
    }
    
});
//POST borrowing book By specifying user_id
router.get('/:bookId/borrow/:userId', checkIsAdmin, async function (req, res, next) {
    var userId = req.params.userId;
    var bookId = req.params.bookId;
    
    var user = await UserModel.getUserById(userId);
    if (!user) {
        req.flash('error', 'There is no Student Id exist, please try another one!');
        res.redirect('back');
        return false;
    } 
    var hasBorrowedBook = await BorrowBookModel.getBorrowBooks(user._id);
    if (hasBorrowedBook.length >= 2) {
        req.flash('error', 'Has reached the upper limit of the book!(One reader can only borrow 2 books at the same time)');
        res.redirect('back');
        return false;
    }

    var borrow = {
        userId: user._id,
        bookId: bookId
    };

    try {
        var book = await LibraryModel.getRawBookById(borrow.bookId);
        if (book.inventory >= 1) {
            try {
                await LibraryModel.updateBookById(borrow.bookId, '59dcc048234ad64c210a7bae', {
                    inventory: book.inventory - 1
                })
                try {
                    await BorrowBookModel.create(borrow)
                    req.flash('success', 'Borrow Successfully by ' + userId +'!');
                    res.redirect('back');
                } catch (error) {
                    req.flash('error', 'Something go wrong, please try again!');
                    res.redirect('back');
                }
            } catch (error) {
                req.flash('error', 'Something go wrong, please try again!');
                res.redirect('back');
            }
            
        } else {
            req.flash('error', 'Zero inventory!');
            res.redirect('back');
        }
    } catch (error) {
        req.flash('error', 'Your book Id maybe wrong, please try again!');
        res.redirect('back');
    }
    
});



module.exports = router;