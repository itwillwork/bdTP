var connection = require('./../connection'),
	helper = require('./../helper'),
	async = require('async'),
	error = helper.errors;

module.exports.create = function(dataObject, responceCallback) {
	async.parallel([
		function (callback) {
			if (!helper.requireFields(dataObject, ['name', 'short_name', 'user'])) {
				callback(error.requireFields, null);
			} else {
				callback(null, null);
			}
		},
		function (callback){
			connection.db.query("SELECT COUNT(*) AS count FROM user WHERE email = ?",
				[dataObject.user], 
				function(err, res) {
					if (err) err = helper.mysqlError(err.errno);
					else {
						if (res[0].count == 0) err = error.norecord;
					}
					if (err) callback(err, null);
					else callback(null, res);
				});
		}
	],
	function(err, results){
		if (err) responceCallback(err.code, err.message);
		else {
			//запрос проверен
			connection.db.query("INSERT INTO forum (name, shortname, userEmail) values (?, ?, ?)", 
				[dataObject.name, dataObject.short_name, dataObject.user], 
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else module.exports.details({user: dataObject.follower}, responceCallback);
				});
		}
	});
}


module.exports.details = function(dataObject, responceCallback) {
	//TODO добавить метод
	responceCallback(0, "Метод пока не реализован");
}

module.exports.listPosts = function(dataObject, responceCallback) {
	//TODO добавить метод
	responceCallback(0, "Метод пока не реализован");
}

module.exports.listThreads = function(dataObject, responceCallback) {
	//TODO добавить метод
	responceCallback(0, "Метод пока не реализован");
}

module.exports.listUsers = function(dataObject, responceCallback) {
	//TODO добавить метод
	responceCallback(0, "Метод пока не реализован");
}
