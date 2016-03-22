var connection = require('./../connection'),
	helper = require('./../helper'),
	async = require('async'),
	moment = require('moment'),
	userModel = require('./user'),
	forumModel = require('./forum'),
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
			responceCallback(0, {
				'date': moment(dataObject.date).format("YYYY-MM-DD HH:mm:ss"),
				'forum': dataObject.forum,
				'id': results[1].insertId,
				'isClosed': !!dataObject.isClosed,
				'isDeleted': !!dataObject.isDeleted,
				'message': dataObject.message,
				'slug': dataObject.slug,
				'title': dataObject.title,
				'user': dataObject.user 
			});
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
/**
 * переворачивает подмассивы с одинаковым началом materPath
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
function descTreatment(res) {
	if (res.length < 2) return;
	var leftFlag = 0,
		rightFlag = 0,
		prefix = res[0].materPath.slice(0, 2);
	for (var i = 0; i < res.length - 1; i++) {
		if ( prefix !== res[i+1].materPath.slice(0, 2) ) {
			rightFlag = i;
			reversArray(res, leftFlag, rightFlag);
			leftFlag = i + 1;
			prefix = res[i+1].materPath.slice(0, 2);
		}
	}
	rightFlag = i;
	reversArray(res, leftFlag, rightFlag);
}
/**
 * переворачивает 
 * @param  {[type]} res       [description]
 * @param  {[type]} leftFlag  [description]
 * @param  {[type]} rightFlag [description]
 * @return {[type]}           [description]
 */
function reversArray(res, leftFlag, rightFlag) {
	if (leftFlag === rightFlag) return;
	var k, j, buf;
	for (k = leftFlag, j = rightFlag; k < j; ++k, --j ) {
		buf = res[k];
		res[k] = res[j];
		res[j] = buf;
	}
}

module.exports.listPosts =  function(dataObject, responceCallback) {
	//собирание запроса
	var sql;
	if(!dataObject.hasOwnProperty('sort')) dataObject.sort = 'flat';
	
	if (dataObject.order !== 'asc') {
		dataObject.order = 'desc';
	}

	if ((dataObject.sort === 'tree') && (dataObject.order === 'desc')) {
		/*
		select materPath from post where threadId = 1 and materPath >= 
		(
		SELECT LPAD(materPath, 2, '') as prefix from post 
		where threadId = 1 order by materPath desc limit 9, 1
			) 
		order by materPath desc;
		 */
		/*
		SELECT MAX(prefix) from (SELECT LPAD(materPath, 2, '') as prefix  from post  where threadId = 1 and date >= "2014-01-01 00:00:00"  order by materPath asc limit 5) as tbl;
		 */
		/*
		select materPath from post where threadId = 1 and materPath >= (
			SELECT MAX(prefix) from (
				SELECT LPAD(materPath, 2, '') as prefix  
				from post  
				where threadId = 1 and date >= "2014-01-01 00:00:00"  
				order by materPath asc limit 5
			) as tbl;
		) order by materPath desc;
		 */
		sql = ' select * from post where threadId = ' + dataObject.thread + ' and ';
		sql += ' materPath >= (';
						if (dataObject.hasOwnProperty('limit')) {
							sql += 'SELECT MAX(prfx) from ( ' +
									' SELECT LPAD(materPath, 2, "") as prfx ' + 
									' from post ' + 
									' where threadId = "' + dataObject.thread + '" '; 
							if (dataObject.hasOwnProperty('since')) {
								sql += ' and date >= "' + dataObject.since + '" ';  
							}
							sql += ' order by materPath asc limit ' + dataObject.limit + ' ';
							sql += ') as tbl ';
						} else {
							sql += ' SELECT LPAD(materPath, 2, "") ' + 
									' from post ' + 
									' where threadId = ' + dataObject.thread; 
							if (dataObject.hasOwnProperty('since')) {
								sql += ' and date >= "' + dataObject.since + '" ';
							}
							sql += ' order by materPath asc ';
							sql += 'limit 1';
						}
		sql += ' )'; 
		if (dataObject.hasOwnProperty('since')) {
			sql += ' and date >= "' + dataObject.since + '" ';
		}
		sql += ' order by materPath desc; ';
		connection.db.query(sql, 
			[], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message);
			else {
				descTreatment(res);
				if (dataObject.limit) {
					res.length = dataObject.limit;
				}
				res = res.map(function(node) {
					return {
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
					}
				});
				responceCallback(0, res);
			}
		});
		
		return;
	}

	sql = ' SELECT * FROM post ';

	sql += ' WHERE (threadId = "' + dataObject.thread + '") ';
	
	if (dataObject.since) sql += ' AND (date >= "' + dataObject.since + '") ';
	
	switch (dataObject.sort) {
		case 'flat': {
				sql += ' ORDER BY date ' + dataObject.order;
				if (dataObject.limit) {
					sql += ' LIMIT ' + dataObject.limit;
				}
			}
			break;
		case 'tree': {
				sql += ' ORDER BY materPath ' + dataObject.order;
				if (dataObject.limit) {
					sql += ' LIMIT ' + dataObject.limit;
				}
			} 
			break;
		case 'parent_tree': {
				var tmp = String( dataObject.limit);
				while (tmp.length < 2) tmp = '0' + tmp;
				sql += ' AND (materPath < "' + tmp + '") ';
				sql += ' ORDER BY materPath ' + dataObject.order;
			} 
			break;
	}
	//запрос
	connection.db.query(sql, [], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message);
			else {
				//жуткий костыль
				
				if ((dataObject.sort === 'parent_tree') && (dataObject.order === 'desc')) {
					descTreatment(res);	
				}
				
				res = res.map(function(node) {
					return {
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
					}
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