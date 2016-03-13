var express = require('express'),
    router = express.Router(),
    model = require('./../models/forum'),
    responceCallback = require('./../responce');

router.post('/create', function(req, res) {
    model.create(req.body, responceCallback(res));
});

router.get('/details', function(req, res) {
    model.details(req.query, responceCallback(res));
});

router.get('/listPosts', function(req, res) {
    model.listPosts(req.query, responceCallback(res));
});

router.get('/listThreads', function(req, res) {
    model.listThreads(req.query, responceCallback(res));
});

router.get('/listUsers', function(req, res) {
    model.listUsers(req.query, responceCallback(res));
});

module.exports = router;