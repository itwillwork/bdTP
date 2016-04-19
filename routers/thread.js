var express = require('express'),
    router = express.Router(),
    model = require('./../models/thread'),
    responceCallback = require('./../responce');

router.post('/close', function(req, res) {
    model.close(req.body, responceCallback(res));
});

router.post('/create', function(req, res) {
    model.create(req.body, responceCallback(res));
});

router.get('/details', function(req, res) {
    model.details(req.query, responceCallback(res));
});

router.get('/list', function(req, res) {
    model.list(req.query, responceCallback(res));
});

router.get('/listPosts', function(req, res) {
    model.listPosts(req.query, responceCallback(res));
});

router.post('/open', function(req, res) {
    model.open(req.body, responceCallback(res));
});

router.post('/remove', function(req, res) {
    model.remove(req.body, responceCallback(res));
});

router.post('/restore', function(req, res) {
    model.restore(req.body, responceCallback(res));
});

router.post('/subscribe', function(req, res) {
    model.subscribe(req.body, responceCallback(res));
});

router.post('/unsubscribe', function(req, res) {
    model.unsubscribe(req.body, responceCallback(res));
});

router.post('/update', function(req, res) {
    model.update(req.body, responceCallback(res));
});

router.post('/vote', function(req, res) {
    model.vote(req.body, responceCallback(res));
});

module.exports = router;
