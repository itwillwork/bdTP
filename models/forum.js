var connection = require('./../connection'),
	helper = require('./../helper'),
	async = require('async'),
	userModel = require('./user'),
	threadModel = require('./thread'),
	postModel = require('./post'),
	views = require('./../views'),
	error = helper.errors;

module.exports.create = function(dataObject, responceCallback) {
	if (!helper.requireFields(dataObject, ['name', 'short_name', 'user'])) {
		responceCallback(error.requireFields.code, error.requireFields.message);
		return;
	}
	async.series([
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
			results = results[2][0];
			responceCallback(0, views.forum(results, results.userEmail));
		}
	});
}


module.exports.details = function(dataObject, responceCallback) {
	if (!helper.possibleValues([dataObject.related], [['user', '']])) {
		responceCallback(error.semantic.code, error.semantic.message);
		return;
	}
	if (!helper.requireFields(dataObject, ['forum'])) {
		responceCallback(error.requireFields.code, error.requireFields.message);
		return;
	}

	connection.db.query('SELECT * FROM forum WHERE shortname = ?',
		[dataObject.forum],
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			else {
				if (res.length === 0) err = error.norecord;
			}
			if (err) responceCallback(err.code, err.message);
			else {
				res = res[0];
				if (dataObject.related === 'user') {
					var userObject = {
						user: res.userEmail
					}
					userModel.moreDetails(userObject, userObject, userObject,
						wrapperFunctionForDetails(responceCallback, res));
				} else {
					responceCallback(0, views.forum(res, res.userEmail));
				}
			}
	});
}
/**
 * Функция обертка для дозаписи юзера в ответ
 * @param  {Function} responceCallback
 * @param  {Object} results
 * @return {Function} callback for userModel.moreDetails
 */
function wrapperFunctionForDetails(responceCallback, results) {
	return function(code, info) {
				// предполагается, что code === 0, так как юзер должен быть
				responceCallback(code, views.forum(results, info));
			}
}

function getSQLforListPosts(dataObject) {
	var sql = ' SELECT id FROM post ';
	sql += ' WHERE (post.forumShortname = "' + dataObject.forum + '") ';
	if (dataObject.since) sql += ' AND (post.date >= "' + dataObject.since + '") ';
	if (dataObject.order !== 'asc') {
		dataObject.order = 'desc';
	}
	sql += ' ORDER BY post.date ' + dataObject.order;
	if (dataObject.limit) {
		sql += ' LIMIT ' + dataObject.limit;
	}
	return sql;
}

module.exports.listPosts = function(dataObject, responceCallback) {
	connection.db.query(getSQLforListPosts(dataObject), [],
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message);
			else {
				res = res.map(function(node){
					return function(callback) {
						postModel.details({
							post: node.id,
							related: dataObject.related
						}, function(code, res) { callback(null, res); });
					}
				});
				async.parallel(res, function (err, res) {
					if (err) responceCallback(err.code, err.message);
					else {
						responceCallback(0, res);
					}
				});
			}
		});
}

function getSQLforlistThreads(dataObject) {
	var sql = ' SELECT id FROM thread ';
	sql += ' WHERE (thread.forumShortname = "' + dataObject.forum + '") ';
	if (dataObject.since) sql += ' AND (thread.date >= "' + dataObject.since + '") ';
	if (dataObject.order !== 'asc') {
		dataObject.order = 'desc';
	}
	sql += ' ORDER BY thread.date ' + dataObject.order;
	if (dataObject.limit) {
		sql += ' LIMIT ' + dataObject.limit;
	}
	return sql;
}

module.exports.listThreads = function(dataObject, responceCallback) {
	connection.db.query(getSQLforlistThreads(dataObject), [],
		function(err, res) {
			if (err) err = helper.mysqlError(err.errno);
			if (err) responceCallback(err.code, err.message);
			else {
				res = res.map(function(node){
					return function(callback) {
						threadModel.details({
							thread: node.id,
							related: dataObject.related
						}, function(code, res) { callback(null, res); });
					}
				});
				async.parallel(res, function (err, res) {
					if (err) responceCallback(err.code, err.message);
					else {
						responceCallback(0, res);
					}
				});
			}
		});
}

function getSQLForListUsers(wherefrom) {
	var sql = 'SELECT DISTINCT userEmail AS uEmail FROM post ';

	sql += ' JOIN user ON user.email = post.userEmail ';

	sql += ' WHERE post.forumShortname = "' + wherefrom.forum + '" ';
	sql += ' AND post.isDeleted = false '
	if (wherefrom.since_id) {
		sql += ' AND user.id >= ' + wherefrom.since_id;
	}
	if (wherefrom.order !== 'asc') {
		wherefrom.order = 'desc';
	}
	sql += ' ORDER BY user.name ' + wherefrom.order;
	if (wherefrom.limit) {
		sql += ' LIMIT ' + wherefrom.limit;
	}
	return sql;
}

module.exports.listUsers = function(dataObject, responceCallback) {
	if (!helper.possibleValues([dataObject.order], [['desc', 'asc']])) {
		responceCallback(error.semantic.code, error.semantic.message);
		return;
	}
	if (!helper.requireFields(dataObject, ['forum'])) {
		responceCallback(error.requireFields.code, error.requireFields.message);
		return;
	}
	connection.db.query( getSQLForListUsers(dataObject),
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
						var userObject = {
							user: elem.uEmail
						}
						userModel.moreDetails(userObject, userObject, userObject,
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
