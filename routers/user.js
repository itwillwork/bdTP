var express = require('express'),
    router = express.Router(),
    model = require('./../models/user'),
    responceCallback = require('./../responce');

router.post('/create', function(req, res) {
    model.create(req.body, responceCallback(res));
    responceCallback(4, "sdfsdf");
});

router.get('/details/', function(req, res) {
    model.details(req.query, responceCallback(res));
});

router.get('/listFollowing/', function(req, res) {
    model.listFollowing(req.query, responceCallback(res));
});

router.get('/listFollowers/', function(req, res) {
    model.listFollowers(req.query, responceCallback(res));
});

router.get('/listPosts/', function(req, res) {
    model.listPosts(req.query, responceCallback(res));
});

router.post('/follow/', function(req, res) {
    model.follow(req.body, responceCallback(res));
});

router.post('/unfollow/', function(req, res) {
    model.unfollow(req.body, responceCallback(res));
});

router.post('/updateProfile/', function(req, res) {
    model.updateProfile(req.body, responceCallback(res));
});

module.exports = router;