var mysql = require('mysql'),
    connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '5905'
    });
connection.connect();
module.exports.db = connection;