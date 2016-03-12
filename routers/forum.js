var express = require('express'),
    router = express.Router(),
    model = require('./../models/forum');

router.get('/', function(req, res) {
    res.send('forum routing');
});

module.exports = router;