var express = require('express'),
    router = express.Router(),
    model = require('./../models/post');

router.get('/', function(req, res) {
    res.send('post routing');
});

module.exports = router;