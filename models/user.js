var connection = require('./../connection'),
	helper = require('./../helper'),
	async = require('async'),
	error = helper.errors;

module.exports.create = function(dataObject, responceCallback) {
	async.series([
		function(callback) {
			if (!helper.requireFields(dataObject, ['username', 'about', 'name', 'email'])) {
				callback(error.requireFields, null);
			}
			callback(null, null);
		},
		function(callback) {
			connection.db.query("INSERT INTO user (username, about, name, email, isAnonymous) values (?, ?, ?, ?, ?)", 
				[dataObject.username, dataObject.about, dataObject.name, dataObject.email, !!(dataObject.isAnonymous)], 
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else callback(null, res);
				});
		},
		function(callback) {
			connection.db.query("SELECT * FROM user WHERE email = ?", 
				[dataObject.email], 
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else callback(null, res);
				});
		}
	], function(err, res) {
		if (err) responceCallback(err.code, err.message);
		else responceCallback(0, {
			"about": res[2][0].about,
			"email": res[2][0].email,
			"id": res[2][0].id,
			"isAnonymous": !!(res[2][0].isAnonymous),
			"name": res[2][0].name,
			"username": res[2][0].username 
		});	
	});
}

module.exports.details = function(dataObject, responceCallback) {
	async.series([
		function (callback) {
			if (!helper.requireFields(dataObject, ['user'])) {
				callback(error.requireFields, null);
			}
			callback(null, null);
		},
		function (callback) {
			connection.db.query("SELECT * FROM user WHERE email = ?", 
				[dataObject.user], 
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else callback(null, res);
				});
		},
		function (callback) {
			//TODO folowers
			callback(null, null);
		},
		function (callback) {
			//TODO folowers
			callback(null, null);
		},
		function (callback) {
			//TODO subscriptions
			callback(null, null);
		}
	], function(err, res) {
		if (err) responceCallback(err.code, err.message);
		else responceCallback(0, {
			"about": res[1][0].about,
			"email": res[1][0].email,
			"followers": [],
			"following": [],
			"id": res[1][0].id,
			"isAnonymous": !!(res[1][0].isAnonymous),
			"name": res[1][0].name,
			"subscriptions": [],
			"username": res[1][0].username 
		});	
	});
}