module.exports = function (res) {
	return function(code, response) {
		res.status(200);
		res.json({
			"code": code,
			"response": response
		});
	}
}
