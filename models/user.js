var connection = require('./../connection'),
	helper = require('./../helper'),
	async = require('async'),
	error = helper.errors;

module.exports.create = function(dataObject, responceCallback) {
	async.series([
		function(callback) {
			if (!helper.requireFields(dataObject, ['username', 'about', 'name', 'email'])) {
				callback(error.requireFields, null);
			} else {
				callback(null, null);
			}
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
			} else {
				callback(null, null);
			}
		},
		function (callback) {
			connection.db.query("SELECT * FROM user WHERE email = ?", 
				[dataObject.user], 
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else callback(null, res);
				});
		}
	], function(err, res) {
		if (err) responceCallback(err.code, err.message);
		else module.exports.moreDetails(res[1][0], {user: res[1][0].email}, {user: res[1][0].email}, responceCallback);
	});
}

module.exports.follow = function(dataObject, responceCallback) {
	async.parallel([
		function (callback) {
			if (!helper.requireFields(dataObject, ['follower', 'followee'])) {
				callback(error.requireFields, null);
			} else {
				callback(null, null);
			}
		},
		function (callback){
			connection.db.query("SELECT COUNT(*) AS count FROM user WHERE email = ?",
				[dataObject.follower], 
				function(err, res) {
					if (err) {
						callback( helper.mysqlError(err.errno) , null);
					} else if (res[0].count == 0) {
						callback( error.norecord, null);
					} else {
						callback(null, res);
					}
				});
		},
		function (callback){
			connection.db.query("SELECT COUNT(*) AS count FROM user WHERE email = ?",
				[dataObject.followee], 
				function(err, res) {
					if (err) {
						callback( helper.mysqlError(err.errno) , null);
					} else if (res[0].count == 0) {
						callback( error.norecord, null);
					} else {
						callback(null, res);
					}
				});
		},
		function (callback){
			connection.db.query("SELECT COUNT(*) AS count FROM followers WHERE followerEmail = ? AND followeeEmail = ?",
				[dataObject.follower, dataObject.followee], 
				function(err, res) {
					if (err) {
						callback( helper.mysqlError(err.errno) , null);
					} else if (res[0].count > 0) {
						callback( error.duplicateRecord, null);
					} else {
						callback(null, res);
					}
				});
		}
	],
	function(err, results){
		if (err) responceCallback(err.code, err.message);
		else {
			//запрос проверен
			connection.db.query("INSERT INTO followers (followerEmail, followeeEmail) values (?, ?)", 
				[dataObject.follower, dataObject.followee], 
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else module.exports.details({user: dataObject.follower}, responceCallback);
				});
		}
	});
}

module.exports.unfollow = function(dataObject, responceCallback) {
	//TODO можно попробовать убрать для оптимизации
	async.parallel([
		function (callback) {
			if (!helper.requireFields(dataObject, ['follower', 'followee'])) {
				callback(error.requireFields, null);
			} else {
				callback(null, null);
			}
		},
	],
	function(err, results){
		if (err) responceCallback(err.code, err.message);
		else {
			//запрос проверен
			connection.db.query("DELETE FROM followers WHERE followerEmail = ? AND followeeEmail = ?", 
				[dataObject.follower, dataObject.followee], 
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else module.exports.details({user: dataObject.follower}, responceCallback);
				});
		}
	});
}

module.exports.updateProfile = function(dataObject, responceCallback) {
	//TODO можно попробовать убрать для оптимизации
	async.parallel([
		function (callback) {
			if (!helper.requireFields(dataObject, ['about', 'user', 'name'])) {
				callback(error.requireFields, null);
			} else {
				callback(null, null);
			}
		},
		function (callback) {
			connection.db.query("SELECT COUNT(*) AS count FROM user WHERE email = ?",
				[dataObject.user], 
				function(err, res) {
					if (err) {
						callback( helper.mysqlError(err.errno) , null);
					} else if (res[0].count == 0) {
						callback( error.norecord, null);
					} else {
						callback(null, res);
					}
				});
		}
	],
	function(err, results){
		if (err) responceCallback(err.code, err.message);
		else {
			//запрос проверен
			connection.db.query("UPDATE user SET name = ?, about = ? WHERE email = ?", 
				[dataObject.name, dataObject.about, dataObject.user], 
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else module.exports.details({user: dataObject.user}, responceCallback);
				});
		}
	});
}

/**
 * составитель запросов для user.listFollowers и user.listFollowing
 */
function getSQLForFollowers (target, wherefore, wherefrom) {
	var sql = 'SELECT ' + target + ' FROM followers ';
	if (wherefrom.order !== 'asc') {
		wherefrom.order = 'desc';
	}
	sql += ' WHERE ' + wherefore + ' = ? ';
	if (wherefrom.since_id) {
		sql += ' AND id >= ' + wherefrom.since_id
	}
	sql += ' ORDER BY ' + target + ' ' + wherefrom.order;
	if (wherefrom.limit) {
		sql += ' LIMIT ' + wherefrom.limit;
	}
	return sql;
} 

module.exports.moreDetails = function(dataObject, listFollowers, listFollowing, responceCallback) {
	async.parallel([
		function (callback) {		
			connection.db.query( getSQLForFollowers('followeeEmail', 'followerEmail', listFollowers),
				[listFollowers.user], 
				function(err, res) {
					if (err) {
						callback( helper.mysqlError(err.errno) , null);
					} else {
						callback(null, res);
					}
				});
		},
		function (callback) {
			connection.db.query( getSQLForFollowers('followerEmail', 'followeeEmail', listFollowers),
				[listFollowers.user], 
				function(err, res) {
					if (err) {
						callback( helper.mysqlError(err.errno) , null);
					} else {
						callback(null, res);
					}
				});
		},
		function (callback) {
			//TODO subscribes
			callback(null, null);
		}
	],
	function(err, results){
		if (err) responceCallback(err.code, err.message);
		else {
			responceCallback(0, {
			"about": dataObject.about,
			"email": dataObject.email,
			"followers": results[1].map(function(elem) {
						  return elem.followerEmail;
						}),
			"following": results[0].map(function(elem) {
						  return elem.followeeEmail;
						}),
			"id": dataObject.id,
			"isAnonymous": !!(dataObject.isAnonymous),
			"name": dataObject.name,
			"subscriptions": [],
			"username": dataObject.username 
		});	
		}
	});
}