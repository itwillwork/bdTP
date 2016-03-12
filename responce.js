module.exports = function (res) {
	return function(code, responce) {
		res.status(200);
		res.json({
			"code": code,
			"responce": responce
		});
	}
} 