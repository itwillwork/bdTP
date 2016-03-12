var express = require('express'),
    router = express.Router(),
    model = require('./../models/user'),
    responceCallback = require('./../responce');

router.get('/', function(req, res) {
    res.send('user routing');
});

router.post('/create', function(req, res) {
    model.create(req.body, responceCallback(res));
});

router.get('/details/', function(req, res) {
    model.details(req.query, responceCallback(res));
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