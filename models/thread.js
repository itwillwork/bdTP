var connection = require('./../connection'),
	helper = require('./../helper'),
	async = require('async'),
	moment = require('moment'),
	userModel = require('./user'),
	forumModel = require('./forum'),
	postModel = require('./post'),
	error = helper.errors;

module.exports.close =  function(dataObject, responceCallback) {
	connection.db.query('UPDATE thread SET isClosed = true WHERE id = ?', 
		[dataObject.thread], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message);
			responceCallback(0, dataObject);
		});
}

module.exports.create =  function(dataObject, responceCallback) {
	if (dataObject.isDeleted !== true) dataObject.isDeleted = false;
	async.series([
		function (callback) {
			if (!helper.requireFields(dataObject, ['forum', 'title', 'isClosed', 'user', 'date', 'message', 'slug'])) {
				callback(error.requireFields, null);
			} else {
				callback(null, null);
			}
		},
		function (callback) {
			connection.db.query('INSERT INTO thread (forumShortname, title, isClosed, userEmail, date, message, slug, isDeleted) ' +
											'values (?, ?, ?, ?, ?, ?, ?, ?)', 
				[dataObject.forum, dataObject.title, dataObject.isClosed, dataObject.user, dataObject.date, dataObject.message, dataObject.slug, dataObject.isDeleted], 
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else callback(null, res);
				});
		}
	],
	function(err, results){
		if (err) responceCallback(err.code, err.message);
		else {
			var resp = module.exports.view(dataObject, dataObject.forum, dataObject.user);
			resp.id = results[1].insertId;
			responceCallback(0, resp);
		}
	});
}

module.exports.details =  function(dataObject, responceCallback) {
	if (!dataObject.related) dataObject.related = [];
	if (!helper.requireFields(dataObject, ['thread'])) {
		responceCallback(error.requireFields.code, error.requireFields.message);
		return;
	}
	//responceCallback(0, helper.possibleValuesForVarieble(dataObject.related, ['user', 'forum']));
	//return;
	if (!helper.possibleValuesForVarieble(dataObject.related, ['user', 'forum'])) {
		responceCallback(error.semantic.code, error.semantic.message);
		return;
	}
	connection.db.query('SELECT * FROM thread WHERE id = ?', 
		[dataObject.thread], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			else {
				if (res.length === 0) err = error.norecord;
			}
			if (err) responceCallback(err.code, err.message);
			else {
				//все ок и thread найден
				//отбрасываем лишнее
				res = res[0];
				async.parallel({
					user: function (callback) {
						if (helper.isEntry('user', dataObject.related)) {
							//нужно дальше искать информацию по юзеру
							var userObject = {
								user: res.userEmail
							}
							userModel.moreDetails(userObject, userObject, userObject, function(code, res){
								callback(null, res);
							});
						} else {
							//не нужно дальше искать информацию по юзеру
							callback(null, res.userEmail);
						}
					},
					forum: function (callback) {
						if (helper.isEntry('forum', dataObject.related)) {
							//нужно дальше искать информацию по форуму
							var forumObject = {
								forum: res.forumShortname
							}
							forumModel.details(forumObject, function(code, res){
								callback(null, res);
							});
						} else {
							//не нужно дальше искать информацию по форуму
							callback(null, res.forumShortname);
						}
					}
				}, function (err, results) {
					if (err) responceCallback(err.code, err.message);
					else {
						responceCallback(0, module.exports.view(res, results.forum, results.user));
					}
				});
			}
		});
}

module.exports.list =  function(dataObject, responceCallback) {
	var sql = ' SELECT * FROM thread '

	if (dataObject.user) sql += ' WHERE (thread.userEmail = "' + dataObject.user + '") ';
	if (dataObject.forum) sql += ' WHERE (thread.forumShortname = "' + dataObject.forum + '") ';

	if (dataObject.since) sql += ' AND (thread.date >= "' + dataObject.since + '") ';

	if (dataObject.order !== 'asc') {
		dataObject.order = 'desc';
	}
	sql += ' ORDER BY thread.date ' + dataObject.order;
	
	if (dataObject.limit) {
		sql += ' LIMIT ' + dataObject.limit;
	}
	connection.db.query(sql, [], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message);
			else {
				res = res.map(function(node) {
					return module.exports.view(node, node.forumShortname, node.userEmail); 
				});
				responceCallback(0, res);
			}
		});
}

module.exports.listPosts =  function(dataObject, responceCallback) {
	//собирание запроса
	var sql;
	if(!dataObject.hasOwnProperty('sort')) dataObject.sort = 'flat';
	if (dataObject.order !== 'asc') {
		dataObject.order = 'desc';
	}
	sql = 'SELECT * FROM post WHERE (threadId = "' + dataObject.thread + '") ';
	if (dataObject.since) sql += ' AND (date >= "' + dataObject.since + '") ';
	switch (dataObject.sort + '_' + dataObject.order) {
		case 'flat_asc':
			sql += ' ORDER BY date ASC';
			if (dataObject.limit) {
				sql += ' LIMIT ' + dataObject.limit;
			}
		break;
		case 'flat_desc':
			sql += ' ORDER BY date DESC';
			if (dataObject.limit) {
				sql += ' LIMIT ' + dataObject.limit;
			}
		break;
		case 'tree_asc':
			sql += ' ORDER BY materPath ASC';
			if (dataObject.limit) {
				sql += ' LIMIT ' + dataObject.limit;
			}
		break;
		case 'tree_desc':
			sql += ' order by LPAD(materPath, 2, "") DESC, materPath ASC';
			//sql += ' order by LPAD(materPath, 2, "") DESC, materPath DESC';
			if (dataObject.limit) {
				sql += ' LIMIT ' + dataObject.limit;
			}
		break;
		case 'parent_tree_asc':
			var tmp = String( dataObject.limit);
			while (tmp.length < 2) tmp = '0' + tmp;
			sql += ' AND (materPath < "' + tmp + '") ';
			sql += ' ORDER BY materPath ASC';
		break;
		case 'parent_tree_desc':
			var tmp = String( dataObject.limit);
			while (tmp.length < 2) tmp = '0' + tmp;
			sql += ' AND (materPath < "' + tmp + '") ';
			sql += ' order by LPAD(materPath, 2, "") DESC, materPath ASC';
		break;
	}
	//запрос
	connection.db.query(sql, [], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message);
			else {
				res = res.map(function(node) {
					return postModel.view(node, node.forumShortname, node.threadId, node.userEmail);
					/*{
						"date": moment(node.date).format("YYYY-MM-DD HH:mm:ss"),
						"dislikes": node.dislikes,
						"forum": node.forumShortname,
						"id": node.id,
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
						"user": node.userEmail
						//"materPath": node.materPath
					}*/
				});
				responceCallback(0, res);
			}
		});
}

module.exports.open =  function(dataObject, responceCallback) {
	connection.db.query('UPDATE thread SET isClosed = false WHERE id = ?', 
		[dataObject.thread], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message);
			responceCallback(0, dataObject);
		});
}

module.exports.remove =  function(dataObject, responceCallback) {
	connection.db.query('UPDATE post SET isDeleted = true WHERE threadId = ?', 
				[dataObject.thread], 
				function(err, res) {
					if (err) err = helper.mysqlError(err.errno);
					if (err) responceCallback(err.code, err.message);
					else {
						connection.db.query('UPDATE thread SET isDeleted = true, posts = posts - ? WHERE id = ?', 
							[res.changedRows, dataObject.thread], 
							function(err, res) {
								if (err) err = helper.mysqlError(err.errno);
								if (err) responceCallback(err.code, err.message);
								else responceCallback(0, {
									"thread": dataObject.thread
								});
							});
					}
				});
}

module.exports.restore =  function(dataObject, responceCallback) {
	connection.db.query('UPDATE post SET isDeleted = false WHERE threadId = ?', 
				[dataObject.thread], 
				function(err, res) {
					if (err) err = helper.mysqlError(err.errno);
					if (err) responceCallback(err.code, err.message);
					else {
						connection.db.query('UPDATE thread SET isDeleted = false, posts = posts + ? WHERE id = ?', 
							[res.changedRows, dataObject.thread], 
							function(err, res) {
								if (err) err = helper.mysqlError(err.errno);
								if (err) responceCallback(err.code, err.message);
								else responceCallback(0, {
									"thread": dataObject.thread
								});
							});
					}
				});
}

module.exports.subscribe =  function(dataObject, responceCallback) {
	connection.db.query('INSERT INTO subscribes (userEmail, threadID) values (?, ?);', 
		[dataObject.user, dataObject.thread], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message);
			responceCallback(0, dataObject);
		});
}

module.exports.unsubscribe =  function(dataObject, responceCallback) {
	connection.db.query(' DELETE FROM subscribes WHERE (userEmail = ?) AND (threadID = ?);', 
		[dataObject.user, dataObject.thread], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message);
			responceCallback(0, dataObject);
		});
}

module.exports.update =  function(dataObject, responceCallback) {
	connection.db.query('UPDATE thread SET message = ?, slug = ? WHERE id = ?;', 
		[dataObject.message, dataObject.slug, dataObject.thread], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message) 
			else {
				module.exports.details({thread: dataObject.thread}, responceCallback);	
			}
		});
}

module.exports.vote =  function(dataObject, responceCallback) {
	connection.db.query('UPDATE thread SET points = points + ?,  likes = likes + IF(? = 1, 1, 0),  dislikes = dislikes + IF(? = -1, 1, 0) WHERE id = ?;', 
		[dataObject.vote, dataObject.vote, dataObject.vote, dataObject.thread], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message);
			responceCallback(0, dataObject);
		});
}

module.exports.view = function (dataObject, forumData, userData) {
	return {
		"date": moment(dataObject.date).format("YYYY-MM-DD HH:mm:ss"),
		"dislikes": dataObject.dislikes,
		"forum": forumData,
		"id": dataObject.id,
		"isClosed": !!dataObject.isClosed,
		"isDeleted": !!dataObject.isDeleted,
		"likes": dataObject.likes,
		"message": dataObject.message,
		"points": dataObject.points,
		"posts": dataObject.posts,
		"slug": dataObject.slug,
		"title": dataObject.title,
		"user": userData || null
	}
}