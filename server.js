var express = require('express');
var app = express();

app.listen(80, function() {
    console.log('Все ОК. Слушаем на порту 80.');
});

var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '5905'
});


app.route('/db/api/')
    .get(function(req, res) {
        res.status(200);

        connection.connect();

        connection.query('SHOW DATABASES', function(err, rows, fields) {
            if (err)
                throw err;

            console.log('The solution is: ', rows);
            res.json({
                "code": 200,
                "response": rows
            });
        });

        connection.end();
    })
    .post(function(req, res) {
        res.send('Add a book');
    })
    .put(function(req, res) {
        res.send('Update the book');
    });
