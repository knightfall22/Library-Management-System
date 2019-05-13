var User = require('../lib/mongo').User;

module.exports = {
    // register a user
    create: function (user) {
        return User.create(user).exec();
    },
    //Get user information by student number
    getUserById: function (id) {
        return User
                .findOne({ id: id })
                .addCreatedAt()
                .exec();
    },
    getUserByDefaultId: function(id) {
        return User
                .findOne({ _id: id})
                .addCreatedAt()
                .exec();
    }
};