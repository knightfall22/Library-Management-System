//Create a database connection -create connection to database
var config = require('config-lite')(__dirname);
var Mongolass = require('mongolass'); // mongodb driver
var moment = require('moment');
var objectIdToTimestamp = require('objectid-to-timestamp');

var mongolass = new Mongolass();

mongolass.connect(config.mongodb);

//Generate creation time created_at based on id
mongolass.plugin('addCreatedAt', {
    afterFind: function (results) {
        results.forEach(function (item) {
            item.created_at = moment(objectIdToTimestamp(item._id)).format('YYYY-MM-DD HH:mm');
        });
        return results;
    },
    afterFindOne: function (result) {
        if (result) {
            result.created_at = moment(objectIdToTimestamp(result._id)).format('YYYY-MM-DD HH:mm');
        }
        return result;
    }
});

exports.User = mongolass.model('User', {
    id: { type: 'string'},
    name: { type: 'string' },
    password: { type: 'string' },
    gender: { type: 'string', enum: ['m', 'f', 'x'] },
    bio: { type: 'string' },
    isAdmin: {
        type: 'boolean'
    } // Administrator settings
});
exports.User.index({
    id: 1
}, {
    unique: true
}).exec(); // Find the user based on the username, the username is globally unique 

exports.Library = mongolass.model('Library', {
    admin: {
        type: Mongolass.Types.ObjectId
    },
    name: { // name
        type: 'string'
    },
    author: { // Author
        type: 'string'
    },
    press: { // Publishing Press
        type: 'string'
    },
    inventory: { // in stock
        type: 'number'
    },
    date: { // publication date
        type: 'string'
    },
    score: {  // score
        type: 'number', 
    },
    cover: { // cover
        type: 'string'
    },
    introduction: { // introduction
        type: 'string'
    },
    pv: {
        type: 'number'
    }
});
exports.Library.index({
    admin: 1,
    _id: -1
}).exec(); //View the book in descending order of creation time

exports.BorrowBook = mongolass.model('BorrowBook', {
    userId: {
        type: Mongolass.Types.ObjectId,
    },
    bookId: {
        type: Mongolass.Types.ObjectId
    }
})
exports.BorrowBook.index({
    userId: 1,
    _id: 1
}).exec(); //Get all borrowed books by user
