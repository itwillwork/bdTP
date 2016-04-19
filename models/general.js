var connection = require('./../connection'),
	async = require('async'),
	helper = require('./../helper');

module.exports.clear = function (responceCallback) {
	async.parallel([
		function(callback){
			connection.db.query("TRUNCATE TABLE user",
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else callback(null, res);
				});
		},
		function(callback){
			connection.db.query("TRUNCATE TABLE forum",
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else callback(null, res);
				});
		},
		function(callback){
			connection.db.query("TRUNCATE TABLE thread",
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else callback(null, res);
				});
		},
		function(callback){
			connection.db.query("TRUNCATE TABLE subscribes",
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else callback(null, res);
				});
		},
		function(callback){
			connection.db.query("TRUNCATE TABLE followers",
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else callback(null, res);
				});
		},
		function(callback){
			connection.db.query("TRUNCATE TABLE post",
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else callback(null, res);
				});
		}
	],
	function(err, results){
		if (err) responceCallback(err.code, err.message);
		else responceCallback(0, "OK");
	});
}

module.exports.status = function (responceCallback) {
	async.parallel([
		function(callback){
			connection.db.query("SELECT COUNT(*) AS count FROM user",
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else callback(null, res);
				});
		},
		function(callback){
			connection.db.query("SELECT COUNT(*) AS count FROM thread",
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else callback(null, res);
				});
		},
		function(callback){
			connection.db.query("SELECT COUNT(*) AS count FROM forum",
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else callback(null, res);
				});
		},
		function(callback){
			connection.db.query("SELECT COUNT(*) AS count FROM post",
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else callback(null, res);
				});
		}
	],
	function(err, results){
		if (err) responceCallback(err.code, err.message);
		else responceCallback(0, {
			'user': results[0][0].count,
			'thread': results[1][0].count,
			'forum': results[2][0].count,
			'post': results[3][0].count
		});
	});
}
