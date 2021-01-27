const passport = require('passport');
const local = require('./localStrategy');
const User = require('../schemas/user');

module.exports = () => {
  passport.serializeUser((user, done) => {
    done(null, user.email);
  });

  passport.deserializeUser((email, done) => {
    User.findOne({ email: { $eq: email } })
      .then(user => done(null, user))
      .catch(err => done(err));
  });

  local();
};
