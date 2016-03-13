/**
 * Проверяет наличие и наполненность указанных свойств в объекте
 * @param  {[Object]} dataObject     
 * @param  {[Array]} requriedFields 
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
	semanticError: {
		code: 4,
		message: "Ошибка в запросе"
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
			return this.errors.semanticError;
			break;
		default:
			return this.errors.unknown;
			break;
	}
}