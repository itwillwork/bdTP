var connection = require('./../connection'),
    async = require('async');

module.exports.response = {};

module.exports.create = function(responceCallback) {
	async.series([
		function(callback) {
		    connection.db.query("describe thread", function(err, res) {
		    	if (err) 
		    		callback(3, res);
		        else
		        	callback(err, res);
		    })
		}
	], function(err, res) {
	    if (err) 
	    	responceCallback(err, "ошибка");
	    else
	    	responceCallback(0, res[0]);	
	});
}