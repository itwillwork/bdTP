var express = require('express'),
    router = express.Router(),
    model = require('./../models/thread');

router.get('/', function(req, res) {
    res.send('thread routing');
});

module.exports = router;