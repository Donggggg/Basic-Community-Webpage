const express = require('express');
const { isNotLoggedIn, isLoggedIn } = require('./middlewares');
const User = require('../schemas/user');
const Post = require('../schemas/post');
const Photo = require('../schemas/photo');

const router = express.Router();

// 패스포트 정보 획득
router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

router.get('/join', isNotLoggedIn, (req, res) => {
  res.render('join', { title: '회원가입' });
});

router.get('/about', async (req, res, next) => {
  var users;
  if (req.user) {
    users = await User.find({ _id: { $ne: req.user._id } }).sort({ name: 1 });
  }
  res.render('about', {
    title: '소개 페이지',
    users: users
  });
});

router.get('/board', async (req, res, next) => {
  try {
    var users;
    if (req.user) {
      users = await User.find({ _id: { $ne: req.user._id } }).sort({ name: 1 });
    }
    const posts = await Post.find({}).sort({ createdAt: -1 });
    res.render('board', {
      title: '게시판',
      users: users,
      posts: posts,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get('/gallery', async (req, res, next) => {
  try {
    var users;
    if (req.user) {
      users = await User.find({ _id: { $ne: req.user._id } }).sort({ name: 1 });
    }
    const photos = await Photo.find({}).sort({ createdAt: -1 });
    res.render('gallery', {
      title: '사진 갤러리',
      users: users,
      photos: photos,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  var users;
  if (req.user) {
     users = await User.find({ _id: { $ne: req.user._id } }).sort({ name: 1 });
  }

  res.render('main', {
    title: 'CommunityService',
    users: users
  });
});

module.exports = router;