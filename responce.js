module.exports = function (res) {
	return function(code, response) {
		res.status(200);
		try {
			res.json({
				"code": code,
				"response": response
			});
		} catch (err) {
			//console.log(err);
			//console.log("почему-то не получается правильно отправить ответ(");
		}
	}
}
