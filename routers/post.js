var express = require('express'),
    router = express.Router(),
    model = require('./../models/post'),
    responceCallback = require('./../responce');

router.post('/create', function(req, res) {
    model.create(req.body, responceCallback(res));
});

router.get('/details', function(req, res) {
    model.details(req.query, responceCallback(res));
});

router.get('/list', function(req, res) {
    model.list(req.query, responceCallback(res));
});

router.post('/remove', function(req, res) {
    model.remove(req.body, responceCallback(res));
});

router.post('/restore', function(req, res) {
    model.restore(req.body, responceCallback(res));
});

router.post('/update', function(req, res) {
    model.update(req.body, responceCallback(res));
});

router.post('/vote', function(req, res) {
    model.vote(req.body, responceCallback(res));
});

module.exports = router;