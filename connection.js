var mysql = require('mysql'),
	pool  = mysql.createPool({
		connectionLimit : 50,
		host: 'localhost',
        user: 'root',
        password: '5905',
        database: 'dbfortphomework'
	});
module.exports.db = pool;
