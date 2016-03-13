var connection = require('./../connection'),
	helper = require('./../helper'),
	async = require('async'),
	userModel = require('./user'),
	error = helper.errors;

module.exports.create =  function(dataObject, responceCallback) {
	async.parallel([
		function (callback) {
			if(!dataObject.hasOwnProperty('parent')) dataObject.parent = null;
			if(!dataObject.hasOwnProperty('isSpam')) dataObject.isSpam = false;
			if(!dataObject.hasOwnProperty('isApproved')) dataObject.isApproved = false;
			if(!dataObject.hasOwnProperty('isEdited')) dataObject.isEdited = false;
			if(!dataObject.hasOwnProperty('isHighlighted')) dataObject.isHighlighted = false;
			if(!dataObject.hasOwnProperty('isDeleted')) dataObject.isDeleted = false;
			dataObject.materPath = null;
			connection.db.query("INSERT INTO post (isApproved, isDeleted, isEdited, isHighlighted, isSpam, message, parent, threadId, date, forumShortname, userEmail, materPath) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", 
				[dataObject.isApproved, dataObject.isDeleted, dataObject.isEdited, dataObject.isHighlighted, dataObject.isSpam, dataObject.message, dataObject.parent,
				dataObject.thread, dataObject.date, dataObject.forum, dataObject.user, dataObject.materPath], 
				function(err, res) {
					if (err) callback( helper.mysqlError(err.errno) , null);
					else callback(null, res);
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
			responceCallback(0, {
				"date": dataObject.date,
				"forum": dataObject.forum,
				"id": results[0].insertId,
				"isApproved": dataObject.isApproved,
				"isDeleted": dataObject.isDeleted,
				"isEdited": dataObject.isEdited,
				"isHighlighted": dataObject.isHighlighted,
				"isSpam": dataObject.isSpam,
				"message": dataObject.message,
				"parent": dataObject.parent,
				"thread": dataObject.thread,
				"user": dataObject.userEmail
			});
		}
	});
}

module.exports.details =  function(dataObject, responceCallback) {
	connection.db.query('SELECT * FROM post WHERE id = ?', 
		[dataObject.post], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			else {
				if (res.length === 0) err = error.norecord;
			}
			if (err) responceCallback(err.code, err.message);
			else {
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
						//TODO доделать
						callback(null, res.forumShortname);
					},
					thread: function (callback) {
						//TODO доделать
						callback(null, res.threadId);
					}
				}, function (err, results) {
					if (err) responceCallback(err.code, err.message);
					else {
						responceCallback(0, {
							"date": res.date,
							"dislikes": res.dislikes,
							"forum": results.forum,
							"id": res.id,
							"isApproved": !!res.isApproved,
							"isDeleted": !!res.isDeleted,
							"isEdited": !!res.isEdited,
							"isHighlighted": !!res.isHighlighted,
							"isSpam": !!res.isSpam,
							"likes": res.likes,
							"message": res.message,
							"parent": res.parent,
							"points": res.points,
							"thread": results.thread,
							"user": results.user
						});
					}
				});
			}
		});
}

module.exports.list =  function(dataObject, responceCallback) {
	//TODO реализовать
	responceCallback(0, "метод еще не реализован")
}

module.exports.remove =  function(dataObject, responceCallback) {
	//TODO реализовать
	responceCallback(0, "метод еще не реализован")
}

module.exports.restore =  function(dataObject, responceCallback) {
	//TODO реализовать
	responceCallback(0, "метод еще не реализован")
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