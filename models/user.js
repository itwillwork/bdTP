var connection = require('./../connection'),
	helper = require('./../helper'),
	moment = require('moment'),
	async = require('async'),
	error = helper.errors;

module.exports.create = function(dataObject, responceCallback) {
	if (!dataObject.username) dataObject.username = '';
	if (!dataObject.about) dataObject.about = '';
	if (!dataObject.name) dataObject.name = '';
	async.series([
		function(callback) {
			if (!helper.requireFields(dataObject, ['email'])) {
				callback(error.requireFields, null);
			} else {
				callback(null, null);
			}
		},
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
			res = res[2][0];
			responceCallback(0, {
				"about": res.about,
				"email": res.email,
				"id": res.id,
				"isAnonymous": !!(res.isAnonymous),
				"name": res.name,
				"username": res.username 
			});	
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
		callback(error.requireFields, null);
	} else {
		module.exports.moreDetails(dataObject, dataObject, dataObject, responceCallback);
	}
}

module.exports.listFollowing = function(dataObject, responceCallback) {
	async.series([
		function (callback) {
			if (!helper.possibleValues([dataObject.order], [['desc', 'asc']])) {
				callback(error.semantic, null);
			} else {
				callback(null, null);
			}
		},
		function (callback) {
			if (!helper.requireFields(dataObject, ['user'])) {
				callback(error.requireFields, null);
			} else {
				callback(null, null);
			}
		}
	], function(err, res) {
		if (err) responceCallback(err.code, err.message);
		else {
			var userEmail = {
				user: dataObject.user
			}
			module.exports.moreDetails(userEmail, userEmail, dataObject, responceCallback);
		}
	});
}

module.exports.listFollowers = function(dataObject, responceCallback) {
	async.series([
		function (callback) {
			if (!helper.possibleValues([dataObject.order], [['desc', 'asc']])) {
				callback(error.semantic, null);
			} else {
				callback(null, null);
			}	
		},
		function (callback) {
			if (!helper.requireFields(dataObject, ['user'])) {
				callback(error.requireFields, null);
			} else {
				callback(null, null);
			}
		}
	], function(err, res) {
		if (err) responceCallback(err.code, err.message);
		else {
			var userEmail = {
				user: dataObject.user
			}
			module.exports.moreDetails(userEmail, dataObject, userEmail, responceCallback);
		}
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
					if (err) err = helper.mysqlError(err.errno);
					else {
						if (res[0].count == 0) err = error.norecord;
					}
					if (err) callback(err, null);
					else callback(null, res);
				});
		},
		function (callback){
			connection.db.query("SELECT COUNT(*) AS count FROM user WHERE email = ?",
				[dataObject.followee], 
				function(err, res) {
					if (err) err = helper.mysqlError(err.errno);
					else {
						if (res[0].count == 0) err = error.norecord;
					}
					if (err) callback(err, null);
					else callback(null, res);
				});
		},
		function (callback){
			connection.db.query("SELECT COUNT(*) AS count FROM followers WHERE followerEmail = ? AND followeeEmail = ?",
				[dataObject.follower, dataObject.followee], 
				function(err, res) {
					if (err) err = helper.mysqlError(err.errno);
					else {
						if (res[0].count > 0) err = error.duplicateRecord;
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
					if (err) err = helper.mysqlError(err.errno);
					if (err) callback(err, null);
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
					if (err) err = helper.mysqlError(err.errno)
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
	if (wherefrom.since_id) {
		sql += '  JOIN user ON followers.' + target + ' = user.email ';
	}
	sql += ' WHERE ' + wherefore + ' = ? ';
	if (wherefrom.since_id) {
		sql += ' AND user.id >= ' + wherefrom.since_id
	}
	sql += ' ORDER BY ' + target + ' ' + wherefrom.order;
	if (wherefrom.limit) {
		sql += ' LIMIT ' + wherefrom.limit;
	}
	console.log(sql);
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
			connection.db.query( getSQLForFollowers('followeeEmail', 'followerEmail', listFollowers),
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
				responceCallback(0, {
					"about": results.userInfo.about || null,
					"email": results.userInfo.email,
					"following": results.followers.map(function(elem) {
								  return elem.followeeEmail;
								}),
					"followers": results.following.map(function(elem) {
								  return elem.followerEmail;
								}) ,
					"id": results.userInfo.id,
					"isAnonymous": !!(results.userInfo.isAnonymous) ,
					"name": results.userInfo.name || null,
					"subscriptions": results.subscriptions.map(function(elem) {
								  return elem.threadId;
								}) ,
					"username": results.userInfo.username || null
					});	
			} else {
				responceCallback(0, {
					"about": null,
					"email": dataObject.user,
					"followers": [],
					"following": [],
					"id": null,
					"isAnonymous": null,
					"name": null,
					"subscriptions": [],
					"username": null 
					});	
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
					return {
						"date": moment(node.date).format("YYYY-MM-DD HH:mm:ss"),
						"dislikes": node.dislikes,
						"forum": node.forumShortname,
						"id": node.postId,
						"isApproved": !!node.isApproved,
						"isDeleted": !!node.isDeleted,
						"isEdited": !!node.isEdited,
						"isHighlighted": !!node.isHighlighted,
						"isSpam": !!node.isSpam,
						"likes": node.likes,
						"message": node.message,
						"parent": +node.parent || (node.parent !== '0' ? null: 0),
						"points": node.points,
						"thread": node.threadId,
						"user": node.email
					}
				});
				responceCallback(0, res);
			};
		});
}