var connection = require('./../connection'),
	helper = require('./../helper'),
	async = require('async'),
	userModel = require('./user.js'),
	error = helper.errors;

module.exports.create = function(dataObject, responceCallback) {
	async.series([
		function (callback) {
			if (!helper.requireFields(dataObject, ['name', 'short_name', 'user'])) {
				callback(error.requireFields, null);
			} else {
				callback(null, null);
			}
		},
		function (callback) {
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
		},
		function (callback) {
			connection.db.query("INSERT INTO forum (name, shortname, userEmail) values (?, ?, ?)", 
				[dataObject.name, dataObject.short_name, dataObject.user], 
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else callback(null, null);
				});
		},
		function (callback) {
			connection.db.query('SELECT * FROM forum WHERE shortname = ?',
				[dataObject.short_name], 
				function(err, res) {
					if (err) err = helper.mysqlError(err.errno);
					else {
						if (res.length === 0) err = error.notWrite;
					}
					if (err) callback(err, null);
					else callback(null, res);
				});
		}
	],
	function(err, results){
		if (err) responceCallback(err.code, err.message);
		else {
			results = results[3][0];
			responceCallback(0, {
				"id": results.id,
				"name": results.name,
				"short_name": results.shortname,
				"user": results.userEmail 
			});
		}
	});
}


module.exports.details = function(dataObject, responceCallback) {
	async.series([
		function (callback) {
			if (!helper.possibleValues(dataObject.related, ['user', ''])) {
				callback(error.semantic, null);
			} else if (!helper.requireFields(dataObject, ['forum'])) {
				callback(error.requireFields, null);
			} else {
				callback(null, null);
			}
		},
		function (callback) {
			connection.db.query('SELECT * FROM forum WHERE shortname = ?',
				[dataObject.forum], 
				function(err, res) {
					if (err) err = helper.mysqlError(err.errno);
					else {
						if (res.length === 0) err = error.norecord;
					}
					if (err) callback(err, null);
					else callback(null, res);
				});
		}
	], function(err, results) {
		if (err) responceCallback(err.code, err.message);
		else {
			results = results[1][0];
			if (dataObject.related === 'user') {
				var userObject = {
					user: results.userEmail
				}
				userModel.moreDetails(userObject, userObject, userObject, 
					wrapperFunctionForUser(responceCallback, results));
			} else {
				responceCallback(0, {
					"id": results.id,
					"name": results.name,
					"short_name": results.shortname,
					"user": results.userEmail 
				});
			}
		}
	});
}

/**
 * Функция обертка для дозаписи юзера в ответ
 * @param  {Function} responceCallback
 * @param  {Object} results 
 * @return {Function} callback for userModel.moreDetails
 */
function wrapperFunctionForUser(responceCallback, results) {
	return function(code, info) {
				// предполагается, что code === 0, так как юзер должен быть
				responceCallback(code, {
					"id": results.id,
					"name": results.name,
					"short_name": results.shortname,
					"user": info
				});
			}
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
