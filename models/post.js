var connection = require('./../connection'),
	helper = require('./../helper'),
	async = require('async'),
	error = helper.errors;

module.exports.create =  function(dataObject, responceCallback) {
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
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message);
			else responceCallback(0, "OK");
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

module.exports.remove =  function(dataObject, responceCallback) {
	//TODO реализовать
	responceCallback(0, "метод еще не реализован")
}

module.exports.restore =  function(dataObject, responceCallback) {
	//TODO реализовать
	responceCallback(0, "метод еще не реализован")
}

module.exports.update =  function(dataObject, responceCallback) {
	//TODO реализовать
	responceCallback(0, "метод еще не реализован")
}

module.exports.vote =  function(dataObject, responceCallback) {
	connection.db.query('UPDATE post SET points = points + ?,  likes = likes + IF(? = 1, 1, 0),  dislikes = dislikes + IF(? = -1, 1, 0) WHERE id = ?;', 
		[dataObject.vote, dataObject.vote, dataObject.vote, dataObject.post], 
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message);
			responceCallback(0, dataObject);
		});
}