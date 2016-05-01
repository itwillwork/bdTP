var	moment = require('moment');

module.exports.forum = function (dataObject, userData) {
	return {
		"id": dataObject.id,
		"name": dataObject.name,
		"short_name": dataObject.shortname,
		"user": userData
	}
}

module.exports.thread = function (dataObject, forumData, userData) {
	return {
		"date": moment(dataObject.date).format("YYYY-MM-DD HH:mm:ss"),
		"dislikes": dataObject.dislikes,
		"forum": forumData,
		"id": dataObject.id,
		"isClosed": !!dataObject.isClosed,
		"isDeleted": !!dataObject.isDeleted,
		"likes": dataObject.likes,
		"message": dataObject.message,
		"points": dataObject.points,
		"posts": dataObject.posts,
		"slug": dataObject.slug,
		"title": dataObject.title,
		"user": userData || null
	}
}

module.exports.post = function (dataObject, forumData, threadData, userData) {
	return {
		"date": moment(dataObject.date).format("YYYY-MM-DD HH:mm:ss"),
		"dislikes": dataObject.dislikes,
		"forum": forumData,
		"id": dataObject.id,
		"isApproved": !!dataObject.isApproved,
		"isDeleted": !!dataObject.isDeleted,
		"isEdited": !!dataObject.isEdited,
		"isHighlighted": !!dataObject.isHighlighted,
		"isSpam": !!dataObject.isSpam,
		"likes": dataObject.likes,
		"message": dataObject.message,
		"parent": +dataObject.parent || (dataObject.parent !== '0' ? null: 0),
		"points": dataObject.points,
		"thread": threadData,
		"user": userData
	}
}

module.exports.user = function (dataObject, followerData, folowingData, subscriptionsData) {
	return {
		"about": dataObject.about || null,
		"email": dataObject.email,
		"following": followerData,
		"followers": folowingData,
		"id": dataObject.id,
		"isAnonymous": !!(dataObject.isAnonymous) ,
		"name": dataObject.name || null,
		"subscriptions": subscriptionsData,
		"username": dataObject.username || null
	}
}
