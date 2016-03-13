/**
 * Проверяет наличие и наполненность указанных свойств в объекте
 * @param  {[Object]} dataObject     
 * @param  {[Array]} requriedFields 
 * @return {Boolean}
 */
module.exports.requireFields = function (dataObject, requriedFields) {
	for (var i = 0; i < requriedFields.length; i++) {
		if (!dataObject[ requriedFields[i] ]) {
			return false;
		}
	}
	return true;
};
/**
 * Проверяет подходит ли значение под возможные варинаты
 * @param  {String} dataObject 
 * @param  {Array} possibleValues 
 * @return {Boolean}
 */
module.exports.possibleValues = function (dataObject, possibleValues) {
	//если не определенная переменная
	if (dataObject === undefined) return true;
	for (var i = 0; i < possibleValues.length; i++) {
		if (dataObject === possibleValues[i]) return true;
	}
	return false;
}
/**
 * Ошибки и их коды
 */
module.exports.errors = {
	requireFields: {
		code: 2,
		message: "Не хватает параметров в запросе"
	},
	unknown: {
		code: 4,
		message: "Неизвестная ошибка"
	},
	duplicateRecord: {
		code: 5,
		message: "Дублирующася запись"
	},
	norecord: {
		code: 1,
		message: "Такой записи нет"
	},
	semantic: {
		code: 4,
		message: "Ошибка в запросе"
	},
	notWrite: {
		code: 1,
		message: "Ошибка записи, почему-то не записалось(("
	}
};
/**
 * Интерпритатор ошибок из mysql
 * @param  {[type]} errCode [description]
 * @return подбирает нужную ошибку из errors
 */
module.exports.mysqlError = function (errCode) {
	switch(errCode) {
		case 1062:  
			return this.errors.duplicateRecord;
			break;
		case 1064:
			return this.errors.semantic;
			break;
		default:
			return this.errors.unknown;
			break;
	}
}