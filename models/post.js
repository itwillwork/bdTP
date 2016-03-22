var connection = require('./../connection'),
	helper = require('./../helper'),
	async = require('async'),
	userModel = require('./user'),
	threadModel = require('./thread'),
	forumModel = require('./forum'),
	views = require('./../views'),
	error = helper.errors;

module.exports.create =  function(dataObject, responceCallback) {
	if(!dataObject.hasOwnProperty('parent')) dataObject.parent = ''; 
	else if (dataObject.parent === null) dataObject.parent = '';
	if(!dataObject.hasOwnProperty('isSpam')) dataObject.isSpam = false;
	if(!dataObject.hasOwnProperty('isApproved')) dataObject.isApproved = false;
	if(!dataObject.hasOwnProperty('isEdited')) dataObject.isEdited = false;
	if(!dataObject.hasOwnProperty('isHighlighted')) dataObject.isHighlighted = false;
	if(!dataObject.hasOwnProperty('isDeleted')) dataObject.isDeleted = false;
	if (dataObject.parent < 0) {
		responceCallback(error.semantic.code, error.semantic.message);
		return;
	}
	if (!helper.requireFields(dataObject, ['date', 'thread', 'message', 'user', 'forum'])) {
		responceCallback(error.requireFields.code, error.requireFields.message);
		return;
	}
	async.parallel([
		function (callback) {
			
			/**
			 * Примерный алгоритм Material Path
			 * если нет предка, надо найти максимальный
			 * найти math path предка
			 * если предок есть, надо найти максимум по последнему уровню вложенности
			 *
			 * для MaterPath использую 36 систему счисления и 2 позиции в строке для уровня вложенности
			 * 
			 */
			//получаем MaterPath родителя
			connection.db.query("SELECT materPath FROM post WHERE (id = ?) AND (threadId = ?);", 
				[dataObject.parent, dataObject.thread],
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else {
						var parentMathPath
						if (res.length === 0) {
							parentMathPath = '';
						} else {
							parentMathPath = res[0].materPath;
						}
						//максимальный номер ребенка по маске из родителя
						connection.db.query('SELECT MAX(materPath) AS max FROM post WHERE (materPath LIKE ?) AND (threadId = ?) ORDER BY materPath', 
							[parentMathPath + '__', dataObject.thread], 
							function(err, res) {
								if (err) callback( helper.mysqlError(err.errno) , null);
								else {
									//формирование следующего нового MaterPath
									var newMaterPath;
									if (res[0].max === null) {
										//предков этого parenta нет, поэтому создаем новый уровень вложенности
										newMaterPath = parentMathPath + '00';
									} else {
										//2 последних символа строки на один уровень вложенности
										var tmp = res[0].max.slice(-2);
										tmp = (parseInt(tmp, 36) + 1).toString(36);
										while (tmp.length < 2) tmp = '0' + tmp;
										//больше чем 2 последних символа строки
										if (tmp.length > 2) callback( error.notMemory, null);
										newMaterPath = parentMathPath + tmp;
									}
									//записываем все что получилось
									connection.db.query("INSERT INTO post (isApproved, isDeleted, isEdited, isHighlighted, isSpam, message, parent, threadId, date, forumShortname, userEmail, materPath) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", 
										[dataObject.isApproved, dataObject.isDeleted, dataObject.isEdited, dataObject.isHighlighted, dataObject.isSpam, dataObject.message, dataObject.parent,
										dataObject.thread, dataObject.date, dataObject.forum, dataObject.user, newMaterPath], 
										function(err, res) {
											if (err) callback( helper.mysqlError(err.errno) , null);
											else callback(null, res);
										});
								}
							});
					}
				});
		},
		function (callback) {
			connection.db.query('UPDATE thread SET posts = posts + 1 WHERE id = ?;', 
				[dataObject.thread], 
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else callback(null, res);
				});
		}
	], function (err, results) {
		if (err) responceCallback(err.code, err.message);
		else {
			var resp = views.post(dataObject, dataObject.forum, dataObject.thread, dataObject.user);
			resp.id = results[0].insertId
			responceCallback(0, resp);
		}
	});
}

module.exports.details =  function(dataObject, responceCallback) {
	if (!helper.requireFields(dataObject, ['post', ])) {
		responceCallback(error.requireFields.code, error.requireFields.message);
		return;
	}
	connection.db.query('SELECT * FROM post WHERE id = ?', 
		[dataObject.post], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message);
			else {
				if (res.length === 0) {
					responceCallback(1, "sdfsdfds");
					return;
				} else {


					//все ок и post найден
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
						},
						thread: function (callback) {
							if (helper.isEntry('thread', dataObject.related)) {
								//нужно дальше искать информацию по треду
								var threadObject = {
									thread: res.threadId
								}
								threadModel.details(threadObject, function(code, res){
									callback(null, res);
								});
							} else {
								//не нужно дальше искать информацию по треду
								callback(null, res.threadId);
							}
						}
					}, function (err, results) {
						if (err) responceCallback(err.code, err.message);
						else responceCallback(0, views.post(res, results.forum, results.thread, results.user));
					});
				}
			}
		});
}
function getSQLforList(dataObject) {
	//проверить поля
	sql = "SELECT date, dislikes, forumShortname, id, isApproved, isDeleted, isEdited, isHighlighted, isSpam, likes, message, parent, points, threadId, userEmail FROM post "
	
	if (dataObject.forum) sql += 'WHERE (forumShortname = "' + dataObject.forum + '") ';
	if (dataObject.thread) sql += 'WHERE (threadId = "' + dataObject.thread + '") ';

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
module.exports.list =  function(dataObject, responceCallback) {
	connection.db.query(getSQLforList(dataObject), [], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message) 
			else {
				res = res.map(function(node){
					return views.post(node, node.forumShortname, node.threadId, node.userEmail);
				});
				responceCallback(0, res);
			}
		});
}

module.exports.remove =  function(dataObject, responceCallback) {
	connection.db.query('SELECT threadId FROM post WHERE id = ?;', 
		[dataObject.post], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			else {			
				if (res.length == 0) err = helper.norecord;
			}
			err = helper.norecord;
			if (err) responceCallback(err.code, err.message) 
			else {
				async.parallel([
					function (callback) {
						connection.db.query('UPDATE post SET isDeleted = true WHERE id = ?;', 
							[dataObject.post], 
							function(err, res) {
								if (err) err = helper.mysqlError(err.errno);
								if (err) callback(err, null) 
								else callback (null, res);
							});
					}, 
					function (callback) {
						connection.db.query('UPDATE thread SET posts = posts - 1 WHERE id = ?;', 
							[res[0].threadId], 
							function(err, res) {
								if (err) err = helper.mysqlError(err.errno);
								if (err) callback(err, null) 
								else callback (null, res);
							});
					}
				], function (err, res) {
					if (err) responceCallback(err.code, err.message);
					else responceCallback(0, {
							"post": dataObject.post
						});
				});
			}
		});	
}

module.exports.restore =  function(dataObject, responceCallback) {
	connection.db.query('SELECT threadId FROM post WHERE id = ?;', 
		[dataObject.post], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message) 
			else {
				async.parallel([
					function (callback) {
						connection.db.query('UPDATE post SET isDeleted = false WHERE id = ?;', 
							[dataObject.post], 
							function(err, res) {
								if (err) err = helper.mysqlError(err.errno);
								if (err) callback(err, null) 
								else callback (null, res);
							});
					}, 
					function (callback) {
						connection.db.query('UPDATE thread SET posts = posts + 1 WHERE id = ?;', 
							[res[0].threadId], 
							function(err, res) {
								if (err) err = helper.mysqlError(err.errno);
								if (err) callback(err, null) 
								else callback (null, res);
							});
					}
				], function (err, res) {
					if (err) responceCallback(err.code, err.message);
					else responceCallback(0, {
							"post": dataObject.post
						});
				});
			}
		});	
}

module.exports.update =  function(dataObject, responceCallback) {
	connection.db.query('UPDATE post SET message = ? WHERE id = ?;', 
		[dataObject.message, dataObject.post], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message) 
			else {
				module.exports.details(dataObject, responceCallback);
			}
		});
}

module.exports.vote =  function(dataObject, responceCallback) {
	connection.db.query('UPDATE post SET points = points + ?,  likes = likes + IF(? = 1, 1, 0),  dislikes = dislikes + IF(? = -1, 1, 0) WHERE id = ?;', 
		[dataObject.vote, dataObject.vote, dataObject.vote, dataObject.post], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message);
			else {
				module.exports.details(dataObject, responceCallback);	
			}
		});
}