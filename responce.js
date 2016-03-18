module.exports = function (res) {
	return function(code, response) {
		res.status(200);
		/*res.send(JSON.stringify({
			"code": code,
			"response": response
		}));*/
		
		res.json({
			"code": code,
			"response": response
		});
	}
} 