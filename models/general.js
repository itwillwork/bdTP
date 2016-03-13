var connection = require('./../connection'),
	async = require('async'),
	helper = require('./../helper');

module.exports.clear = function (responceCallback) {
	async.parallel([
		/*
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
		}
		*/
		function(callback){
			connection.db.query("TRUNCATE TABLE thread", 
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
	//TODO create method
}