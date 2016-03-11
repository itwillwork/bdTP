var express = require('express'),
    app = express(),
    mysql = require('mysql'),
    connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '5905'
    }),
    modelUser = require('./models/user'),
    modelPost = require('./models/post'),
    modelForum = require('./models/forum'),
    modelThread = require('./models/thread');

app.listen(80, function() {
    console.log('Все ОК. Слушаем на порту 80.');
});