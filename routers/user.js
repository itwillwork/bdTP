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

module.exports = router;