var connection = require('./../connection'),
	helper = require('./../helper'),
	async = require('async'),
	userModel = require('./user.js'),
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
				'date': dataObject.date,
				'forum': dataObject.forum,
				'id': results[1].insertId,
				'isClosed': dataObject.isClosed,
				'isDeleted': dataObject.isDeleted,
				'message': dataObject.message,
				'slug': dataObject.slug,
				'title': dataObject.title,
				'user': dataObject.user 
			});
		}
	});
}

module.exports.details =  function(dataObject, responceCallback) {
	//TODO реализовать
	responceCallback(0, "метод еще не реализован")
}

module.exports.list =  function(dataObject, responceCallback) {
	//TODO реализовать
	responceCallback(0, "метод еще не реализован")
}

module.exports.listPosts =  function(dataObject, responceCallback) {
	//TODO реализовать
	responceCallback(0, "метод еще не реализован")
}

module.exports.open =  function(dataObject, responceCallback) {
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

module.exports.subscribe =  function(dataObject, responceCallback) {
	//TODO реализовать
	responceCallback(0, "метод еще не реализован")
}

module.exports.unsubscribe =  function(dataObject, responceCallback) {
	//TODO реализовать
	responceCallback(0, "метод еще не реализован")
}

module.exports.update =  function(dataObject, responceCallback) {
	//TODO реализовать
	responceCallback(0, "метод еще не реализован")
}

module.exports.vote =  function(dataObject, responceCallback) {
	//TODO реализовать
	responceCallback(0, "метод еще не реализован")
}