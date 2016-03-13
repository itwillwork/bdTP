var connection = require('./../connection'),
	helper = require('./../helper'),
	async = require('async'),
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
	//TODO валидация возможных значений
	/*console.log(dataObject.related);
	if (!helper.requireFields(dataObject, ['forum'])) {
		callback(error.requireFields, null);
	} else {
		module.exports.moreDetails(dataObject, responceCallback);
	}
	async.parallel({
		userInfo: function (callback) {
			//TODO реализовать
			callback(null, null);
		},
		forumInfo: function (callback) {		
			connection.db.query('SELECT * FROM forum WHERE shortname = ?',
				[listFollowers.user], 
				function(err, res) {
					if (err) err = helper.mysqlError(err.errno);
					if (err) callback(err, null);
					else callback(null, res);
				});
		},
	},
	function (err, results) {
		if (err) responceCallback(err.code, err.message);
		else {
			responceCallback(0, {
			"about": results.userInfo[0].about,
			"email": results.userInfo[0].email,
			"followers": results.followers.map(function(elem) {
						  return elem.followeeEmail;
						}),
			"following": results.following.map(function(elem) {
						  return elem.followerEmail;
						}),
			"id": results.userInfo[0].id,
			"isAnonymous": !!(results.userInfo[0].isAnonymous),
			"name": results.userInfo[0].name,
			"subscriptions": results.subscriptions,
			"username": results.userInfo[0].username 
			});	
		}
	});
	*/


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
