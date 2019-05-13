var Library = require('../lib/mongo').Library;

module.exports = {
    // add a book
    create: function create(book) {
        return Library.create(book).exec();
    },
    // Get book by book id
    getBookById: function (bookId) {
        return Library
            .findOne({ _id: bookId })
            .populate({ path: 'admin', model: 'User' })
            .addCreatedAt()
            .exec();
    },
     // Get all books or all books of a specific admin in descending order of creation time 
    getBooks: function(admin) {
        var query = {};
        if (admin) {
            query.admin = admin;
        }
        return Library
            .find(query)
            .populate({ path: 'admin', model: 'User' })
            .sort({ _id: -1 })
            .addCreatedAt()
            .exec();
    },
    searchBook: function(data) { //string
        var queryData = new RegExp(data.trim());
        return Library
            .find({
                '$or': [{
                    name: queryData
                }, {
                    author: queryData
                }, {
                    press: queryData
                }]
            })
            .sort({ _id: -1 })
            .exec();
    },
    checkBook: function(bookName) {
        return Library
                .find({ name: bookName })
                .exec();
    },
    //Get book by book id(edit book)
    getRawBookById: function (bookId) {
        return Library
            .findOne({ _id: bookId })
            .populate({ path: 'admin', model: 'User' })
            .exec();
    },
    //update the book with user id and book id
    updateBookById: function (bookId, admin, data) {
        return Library.update({ admin: admin, _id: bookId }, { $set: data }).exec();
    },
    //delete the book by user id and book id
    delBookById: function (bookId, admin) {
        return Library.remove({ admin: admin, _id: bookId }).exec();
    },
    //add 1 to pv via book id
    incPv: function incPv(bookId) {
        return Library
            .update({ _id: bookId }, { $inc: { pv: 1 } })
            .exec();
    }
};