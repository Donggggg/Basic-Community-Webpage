const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../schemas/user');

const router = express.Router();

// 회원가입
router.post('/join', isNotLoggedIn, async (req, res, next) => {
    const { email, name, password } = req.body;

    // 기존 사용자인 경우 예외 처리
    try {
        const exUser = await User.findOne({ email: { $eq: email } })
        if (exUser) {
            return res.redirect('/join?error=exist');
        }
    } catch (err) {
        console.error(err);
        next(err);
    }

    // 정상 가입 처리
    try {
        const hash = await bcrypt.hash(req.body.password, 12); // 비밀번호 암호화
        const user = await User.create({
            email: req.body.email,
            name: req.body.name,
            password: hash,
        });
        return res.redirect('/');
    } catch (err) {
        console.error(err);
        next(err);
    }
});

// 로그인
router.post('/login', isNotLoggedIn, (req, res, next) => {
    passport.authenticate('local', (authError, user, info) => {
        if (authError) {
            console.error(authError);
            return next(authError);
        }
        if (!user) {
            return res.redirect(`/?loginError=${info.message}`);
        }
        return req.login(user, (loginError) => {
            if (loginError) {
                console.error(loginError);
                return next(loginError);
            }
            return res.redirect('/');
        });
    })(req, res, next);
});

// 로그아웃
router.get('/logout', isLoggedIn, (req, res) => {
    req.logout();
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;