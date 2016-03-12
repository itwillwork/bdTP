var express = require('express'),
    router = express.Router(),
    model = require('./../models/forum'),
    async = require('async'),
    responceCallback = require('./../responce')

router.get('/', function(req, res) {
    res.send('forum routing');
});

router.get('/create', function(req, res) {
    model.create(responceCallback(res));
});

router.get('/details', function(req, res) {
    res.send('forum details');
});

router.get('/listPosts', function(req, res) {
    res.send('forum listPosts');
});

router.get('/listThreads', function(req, res) {
    res.send('forum listThreads');
});

router.get('/listUsers', function(req, res) {
    res.send('forum listUsers');
});

module.exports = router;