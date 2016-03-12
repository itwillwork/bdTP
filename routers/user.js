var express = require('express'),
    router = express.Router(),
    model = require('./../models/user');

router.get('/', function(req, res) {
    res.send('user routing');
});

module.exports = router;