var connection = require('./../connection'),
	helper = require('./../helper'),
	async = require('async'),
	views = require('./../views'),
	error = helper.errors;

module.exports.create = function(dataObject, responceCallback) {
	//TODO можно оптимизировать убрав лищний select
	if (!dataObject.username) dataObject.username = '';
	if (!dataObject.about) dataObject.about = '';
	if (!dataObject.name) dataObject.name = '';
	if (!helper.requireFields(dataObject, ['email'])) {
		responceCallback(error.requireFields.code, error.requireFields.message);
		return;
	}
	async.series([
		function(callback) {
			connection.db.query("INSERT INTO user (username, about, name, email, isAnonymous) values (?, ?, ?, ?, ?)", 
				[dataObject.username, dataObject.about, dataObject.name, dataObject.email, !!(dataObject.isAnonymous)], 
				function(err, res) {
					if (err) err = helper.mysqlError(err.errno);
					if (err) callback(err, null);
					else callback(null, res);
				});
		},
		function(callback) {
			connection.db.query("SELECT * FROM user WHERE email = ?", 
				[dataObject.email], 
				function(err, res) {
					if (err) err = helper.mysqlError(err.errno);
					else {
						if (res.length === 0) err = error.notWrite;
					}
					if (err) callback(err, null);
					else callback(null, res);
				});
		}
	], function(err, res) {
		if (err) responceCallback(err.code, err.message);
		else {
			res = res[1][0];
			responceCallback(0, views.user(res, [], [], []));
		}
	});
}

module.exports.details = function(dataObject, responceCallback) {
	/**
	 *
	 *
	 * SELECT about, email, user.id, GROUP_CONCAT(DISTINCT f1.followeeEmail SEPARATOR ', ') AS followers, GROUP_CONCAT(DISTINCT f2.followerEmail SEPARATOR ', ') AS following, isAnonymous, name, GROUP_CONCAT(DISTINCT threadId SEPARATOR ', ') AS subscriptions, username  FROM user LEFT JOIN subscribes ON email = userEmail LEFT JOIN followers AS f1 ON f1.followerEmail = email LEFT JOIN followers AS f2 ON f2.followeeEmail = email WHERE email = "example34@mail.ru" GROUP BY email;
	 * 
	 */
	if (!helper.requireFields(dataObject, ['user'])) {
		responceCallback(error.requireFields.code, error.requireFields.message);
		return;
	}
	module.exports.moreDetails(dataObject, dataObject, dataObject, responceCallback);
}

module.exports.listFollowing = function(dataObject, responceCallback) {
	if (!helper.possibleValues([dataObject.order], [['desc', 'asc']])) {
		responceCallback(error.semantic.code, error.semantic.message);
		return;
	}
	if (!helper.requireFields(dataObject, ['user'])) {
		responceCallback(error.requireFields.code, error.requireFields.message);
		return;
	} 
	connection.db.query( getSQLForFollowers('followerEmail', 'followeeEmail', dataObject),
		[dataObject.user], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message);
			else {
				if (res.length === 0) {
					responceCallback(0, []);
					return;
				}
				//преобразуем обекты содержащие emailы в функции для асинхронного вызова
				res = res.map( function(elem) {
					return function (callback) {
						var userEmail = {
							user: elem.followerEmail
						}
						module.exports.moreDetails(userEmail, userEmail, userEmail, 
							function(code, res) {
								callback(null, res);
							});
					}
				});
				//асинхронный запрос всех юзеров
				async.parallel(res,
				function (err, results){
					if (err) responceCallback(err.code, err.message);
					else {
						responceCallback(0, results);
					}
				});	
			}
		});
}

module.exports.listFollowers = function(dataObject, responceCallback) {
	if (!helper.possibleValues([dataObject.order], [['desc', 'asc']])) {
		callback(error.semantic, null);
		return;
	}
	if (!helper.requireFields(dataObject, ['user'])) {
		callback(error.requireFields, null);
		return;
	}
	connection.db.query( getSQLForFollowers('followeeEmail', 'followerEmail', dataObject),
		[dataObject.user], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message);
			else {
				if (res.length === 0) {
					responceCallback(0, []);
					return;
				}
				//преобразуем обекты содержащие emailы в функции для асинхронного вызова
				res = res.map( function(elem) {
					return function (callback) {
						var userEmail = {
							user: elem.followeeEmail
						}
						module.exports.moreDetails(userEmail, userEmail, userEmail, 
							function(code, res) {
								callback(null, res);
							});
					}
				});
				//асинхронный запрос всех юзеров
				async.parallel(res,
				function (err, results){
					if (err) responceCallback(err.code, err.message);
					else {
						responceCallback(0, results);
					}
				});	
			}
		});
}

module.exports.follow = function(dataObject, responceCallback) {
	if (!helper.requireFields(dataObject, ['follower', 'followee'])) {
		responceCallback(error.requireFields.code, error.requireFields.message);
	} 
	connection.db.query("SELECT COUNT(*) AS count FROM followers WHERE followerEmail = ? AND followeeEmail = ?",
		[dataObject.follower, dataObject.followee], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			else {
				if (res.count > 0) err = error.duplicateRecord;
			}
			if (err) responceCallback(err.code, err.message);
			else {
				//запрос проверен
				connection.db.query("INSERT INTO followers (followerEmail, followeeEmail) values (?, ?)", 
					[dataObject.follower, dataObject.followee], 
					function(err, res) {
						if (err) err = helper.mysqlError(err.errno);
						if (err) responceCallback(err.code, err.message);
						else module.exports.details({user: dataObject.follower}, responceCallback);
					});
			}
	});
}

module.exports.unfollow = function(dataObject, responceCallback) {
	if (!helper.requireFields(dataObject, ['follower', 'followee'])) {
		responceCallback(error.requireFields.code, error.requireFields.message);
	}
	connection.db.query("DELETE FROM followers WHERE followerEmail = ? AND followeeEmail = ?", 
		[dataObject.follower, dataObject.followee], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message);
			else module.exports.details({user: dataObject.follower}, responceCallback);
		});
}

module.exports.updateProfile = function(dataObject, responceCallback) {
	if (!helper.requireFields(dataObject, ['about', 'user', 'name'])) {
		responceCallback(error.requireFields.code, error.requireFields.message);
	}
	connection.db.query("SELECT COUNT(*) AS count FROM user WHERE email = ?",
		[dataObject.user], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno)
			else {
				if (res.count == 0) err = error.norecord;
			}
			if (err) responceCallback(err.code, err.message);
			else {
				connection.db.query("UPDATE user SET name = ?, about = ? WHERE email = ?", 
					[dataObject.name, dataObject.about, dataObject.user], 
					function(err, res) {
						if (err) responceCallback(err.code, err.message);
						else module.exports.details({user: dataObject.user}, responceCallback);
					});
			}
		});
}

/**
 * составитель запросов для user.listFollowers и user.listFollowing
 */
function getSQLForFollowers (target, wherefore, parameter) {
	/**
	 * select followerEmail from followers JOIN user ON user.email = followers.followeeEmail WHERE followers.followeeEmail = 'example@mail.ru';
	 */
	var sql = 'SELECT ' + target + ' FROM followers ';
	if (parameter.order !== 'asc') {
		parameter.order = 'desc';
	}
	if (parameter.since_id) {
		sql += '  JOIN user ON followers.' + target + ' = user.email ';
	}
	sql += ' WHERE ' + wherefore + ' = ? ';
	if (parameter.since_id) {
		sql += ' AND user.id >= ' + parameter.since_id
	}
	sql += ' ORDER BY ' + target + ' ' + parameter.order;
	if (parameter.limit) {
		sql += ' LIMIT ' + parameter.limit;
	}
	return sql;
} 

module.exports.moreDetails = function(dataObject, listFollowers, listFollowing, responceCallback) {
	async.parallel({
		userInfo: function (callback) {
			connection.db.query("SELECT * FROM user WHERE email = ?", 
				[dataObject.user], 
				function(err, res) {
					if (err) err = helper.mysqlError(err.errno) 
					else {
						if (res.length === 0) res = null;
					}
					if (err) callback(err, null);
					else callback(null, res);
				});
		},
		followers: function (callback) {		
			connection.db.query( getSQLForFollowers('followeeEmail', 'followerEmail', listFollowing),
				[listFollowers.user], 
				function(err, res) {
					if (err) err = helper.mysqlError(err.errno);
					if (err) callback(err, null);
					else callback(null, res);
				});
		},
		following: function (callback) {
			connection.db.query( getSQLForFollowers('followerEmail', 'followeeEmail', listFollowers),
				[listFollowers.user], 
				function(err, res) {
					if (err) err = helper.mysqlError(err.errno);
					if (err) callback(err, null);
					else callback(null, res);
				});
		},
		subscriptions: function (callback) {
			connection.db.query( 'SELECT threadId FROM subscribes WHERE userEmail = ?',
				[dataObject.user], 
				function(err, res) {
					if (err) err = helper.mysqlError(err.errno);
					if (err) callback(err, null);
					else callback(null, res);
				});
		}
	},
	function (err, results) {
		if (err) responceCallback(err.code, err.message);
		else {
			if (results.userInfo)
			{
				results.userInfo = results.userInfo[0];
				responceCallback(0, views.user(results.userInfo, results.followers, results.following, results.subscriptions) );
			} else {
				responceCallback(0, views.user({email: dataObject.user}, [], [], []) );
			}
			
		}
	});
}
/**
 * составитель запросов для user.ListPosts
 */
function getSQLforListPosts(dataObject) {
	sql = "SELECT date, dislikes, forumShortname, post.id AS postId, isApproved, isDeleted, isEdited, isHighlighted, isSpam, likes, message, parent, points, threadId, email FROM user JOIN post ON userEmail = email "
	sql += 'WHERE (email = "' + dataObject.user + '") ';

	if (dataObject.since) {
		sql += ' AND (date >= "' + dataObject.since + '") ';
	}

	if (dataObject.order !== 'asc') {
		dataObject.order = 'desc';
	}
	sql += ' ORDER BY date ' + dataObject.order;

	if (dataObject.limit) {
		sql += ' LIMIT ' + dataObject.limit;
	}
	return sql;
}
module.exports.listPosts = function(dataObject, responceCallback) {
	connection.db.query(getSQLforListPosts(dataObject), [], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno) 
			else {
				if (res.length === 0) err = error.norecord;
			}
			if (err) responceCallback(err.code, err.message);
			else {
				res = res.map(function(node){
					//чтобы работал единый стандарт вывода
					node['id'] = node.postId;
					return views.post(node, node.forumShortname, node.threadId, node.email);
				});
				responceCallback(0, res);
			};
		});
}