const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { isLoggedIn } = require('./middlewares');
const User = require('../schemas/user');
const Photo = require('../schemas/photo');
const HashTag = require('../schemas/hashtag');

const router = express.Router();

// 이미지 파일 저장 디렉토리 생성
try {
    fs.readdirSync('uploads');
} catch (error) {
    console.error('uploads 폴더가 없어 생성합니다.');
    fs.mkdirSync('uploads');
}

// 파일 업로드 multer 생성
const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, cb) {
            cb(null, 'uploads/');
        },
        filename(req, file, cb) {
            const ext = path.extname(file.originalname);
            cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
        },
    }),
    limits: { fileSzie: 5 * 1024 * 1024 },
});

router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {
    res.json({ url: `/img/${req.file.filename}` });
});

const upload2 = multer();

router.post('/finish', isLoggedIn, upload2.none(), async (req, res, next) => {
    var exPhoto;
    const { id, url, tags } = req.body;

    try {
        if (id) {
            exPhoto = await Photo.findOne({ _id: { $eq: id } });
        }

        if (exPhoto) { // 사진 수정
            await Photo.update({ _id: id },
                { $set: { imageUrl: url, tags: tags } });
        } else { // 사진 등록
            await Photo.create({
                userId: req.user._id,
                name: req.user.name,
                imageUrl: req.body.url,
                tags: tags,
            });
        }

        const hashtags = tags.match(/#[^\s#]*/g);
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

        return res.redirect('/gallery');
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.get('/exhibit', isLoggedIn, async (req, res) => { // 기본 사진 등록
    var users;
    if (req.user) {
        users = await User.find({ _id: { $ne: req.user._id } }).sort({ name: 1 });
    }
    res.render('exhibit', {
        title: '사진 등록',
        users: users
    });
});

router.post('/exhibit', isLoggedIn, async (req, res, next) => { // 사진 수정
    const { id } = req.body;
    try {
        var users;
        if (req.user) {
            users = await User.find({ _id: { $ne: req.user._id } }).sort({ name: 1 });
        }
        const photo = await Photo.findOne({ _id: { $eq: id } });
        return res.render('exhibit', {
            title: '사진 수정',
            users: users,
            photo: photo
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.get('/delete/:id', isLoggedIn, async (req, res, next) => { // 사진 삭제
    try {
        const photo = await Photo.findOne({ _id: { $eq: req.params.id } });
        const filepath = './uploads/' + path.basename(photo.imageUrl);
        fs.unlink(`${filepath}`, (err) => { console.error(err) });
        await Photo.remove({ _id: req.params.id });
        return res.redirect('/gallery');
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.get('/search', async (req, res, next) => {
    const query = req.query.search;

    if (!query) {
        return res.redirect('/gallery');
    }
    try {
        let photos = [];
        var users;
        if (req.user) {
            users = await User.find({ _id: { $ne: req.user._id } }).sort({ name: 1 });
        }

        const hashtag = await HashTag.findOne({ title: query });
        if (hashtag) {
            photos = await Photo.find({ tags: { $regex: '.*#' + query + '.*' } }).sort({ createdAt: -1 });
        }

        return res.render('gallery', {
            title: `${query} | 사진 갤러리`,
            users: users,
            photos: photos,
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.get('/:id', async (req, res, next) => { // 사진 열람
    try {
        const photo = await Photo.findOne({ _id: req.params.id });

        if (req.user) {
            var users;
            users = await User.find({ _id: { $ne: req.user._id } }).sort({ name: 1 });

            // 로그인한 유저가 글을 작성한 유저인지 검사
            if (JSON.stringify(req.user._id) == JSON.stringify(photo.userId)) {
                var verified = true;
            } else {
                var verified = false;
            }
        }
        return res.render('watch', {
            title: `${path.basename(photo.imageUrl)} | 사진 갤러리`,
            users: users,
            photo: photo,
            verified: verified
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

module.exports = router;