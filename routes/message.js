const express = require('express');
const { isLoggedIn } = require('./middlewares');
const User = require('../schemas/user');
const Message = require('../schemas/message');

const router = express.Router();

router.post('/send', isLoggedIn, async (req, res, next) => {
    try {
        await Message.create({
            senderId: req.body.senderId,
            receiverId: req.body.receiverId,
            senderName: req.body.senderName,
            receiverName: req.body.receiverName,
            content: req.body.content,
        });
        return res.redirect('/');
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.get('/send/:id', isLoggedIn, async (req, res, next) => {
    try {
        var users;
        var sender, receiver;
        if (req.user) {
            users = await User.find({ _id: { $ne: req.user._id } }).sort({ name: 1 });
            sender = await User.findOne({ _id: req.user._id });
            receiver = await User.findOne({ _id: req.params.id });
        }
        res.render('send', {
            title: '메시지 전송',
            users: users,
            sender: sender,
            receiver: receiver,
        });
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.get('/delete/:id', isLoggedIn, async (req, res, next) => {
    try {
        await Message.remove({ _id: req.params.id });
        return res.redirect('/msg/' + req.user._id);
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.get('/:id', isLoggedIn, async (req, res, next) => {
    try {
        var users;
        if (req.user) {
            users = await User.find({ _id: { $ne: req.user._id } }).sort({ name: 1 });
        }
        messages = await Message.find({ receiverId: req.user._id }).sort({ sentAt: -1 });
        res.render('message', {
            title: '메시지함',
            users: users,
            messages: messages
        });
    } catch (err) {
        console.error(err);
        next(err);
    }
});

module.exports = router;