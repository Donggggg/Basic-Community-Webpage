const express = require('express');
const { isLoggedIn } = require('./middlewares');
const User = require('../schemas/user');
const Post = require('../schemas/post');
const HashTag = require('../schemas/hashtag');

const router = express.Router();

router.post('/finish', isLoggedIn, async (req, res, next) => {
    var exPost;
    const { id, title, content } = req.body;

    try {
        if (id)
            exPost = await Post.findOne({ _id: { $eq: id } });

        if (exPost) { // 게시글 수정
            await Post.update({ _id: id },
                { $set: { title: title, content: content } });
        } else { // 게시글 등록
            await Post.create({
                userId: req.user._id,
                name: req.user.name,
                title: req.body.title,
                content: req.body.content,
            });
        }
        const hashtags = req.body.content.match(/#[^\s#]*/g);
        if (hashtags) {
            await Promise.all(
                hashtags.map(async tag => {
                    const newTag = tag.slice(1);
                    const exHash = await HashTag.findOne({ title: newTag.toLowerCase() });
                    console.log(exHash);
                    if (!exHash)
                        await HashTag.create({ title: newTag.toLowerCase() });
                    return;
                }),
            );
        }
        return res.redirect('/board');
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.get('/write', isLoggedIn, async (req, res, next) => { // 기본 게시글 작성
    var users;
    if (req.user) {
        users = await User.find({ _id: { $ne: req.user._id } }).sort({ name: 1 });
    }
    res.render('write', {
        title: '게시글 작성',
        users: users
    });
});

router.post('/write', isLoggedIn, async (req, res, next) => { // 게시글 수정
    const { id } = req.body;
    try {
        var users;
        if (req.user) {
            users = await User.find({ _id: { $ne: req.user._id } }).sort({ name: 1 });
        }
        const post = await Post.findOne({ _id: { $eq: id } });
        return res.render('write', {
            title: '게시글 수정',
            users: users,
            post: post
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.get('/delete/:id', isLoggedIn, async (req, res, next) => { // 게시글 삭제
    try {
        await Post.remove({ _id: req.params.id });
        return res.redirect('/board');
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.get('/search', async (req, res, next) => {
    const query = req.query.search;
    const standard = req.query.standard;

    if (!query) {
        return res.redirect('/board');
    }
    try {
        let posts = [];
        var users;
        if (req.user) {
            users = await User.find({ _id: { $ne: req.user._id } }).sort({ name: 1 });
        }

        if (standard == 'name') {
            posts = await Post.find({ name: { $regex: '.*' + query + '.*' } }).sort({ createdAt: -1 });
        } else if (standard == 'content') {
            posts = await Post.find({ content: { $regex: '.*' + query + '.*' } }).sort({ createdAt: -1 });
        } else {
            const hashtag = await HashTag.findOne({ title: query });
            if (hashtag) {
                posts = await Post.find({ content: { $regex: '.*#' + query + '.*' } }).sort({ createdAt: -1 });
            }
        }

        return res.render('board', {
            title: `${query} | 게시판`,
            users: users,
            posts: posts,
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.get('/:id', async (req, res, next) => { // 게시글 열람
    try {
        const post = await Post.findOne({ _id: req.params.id });

        // 로그인한 유저가 글을 작성한 유저인지 검사
        if (req.user) {
            var users;
            users = await User.find({ _id: { $ne: req.user._id } }).sort({ name: 1 });

            if (JSON.stringify(req.user._id) == JSON.stringify(post.userId)) {
                var verified = true;
            } else {
                var verified = false;
            }
        }
        return res.render('post', {
            title: `${post.title} | 게시판`,
            users: users,
            post: post,
            verified: verified
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

module.exports = router;