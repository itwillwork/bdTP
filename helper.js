/**
 * Проверяет наличие и наполненность указанных свойств в объекте
 * @param  {[Object]} dataObject
 * @param  {[Array]} requriedFields
 * @return {Boolean}
 */
module.exports.requireFields = function (dataObject, requriedFields) {
	for (var i = 0; i < requriedFields.length; i++) {
		if ((dataObject.hasOwnProperty(requriedFields[i])) &&
			(dataObject[requriedFields[i]] === null)) {
			return false;
		}
	}
	return true;
};
/**
 * Проверяет все ли значения первого массива подходят под возможные значения второго и нет ли среди них лишних
 * @param  {Array} dataObject
 * @param  {Array} requriedFields
 * @return {Boolean}
 */
module.exports.possibleValuesForVarieble = function (dataObject, requriedFields) {
	if (!(dataObject instanceof Array)) dataObject = [dataObject];
	for (var j = 0; j < dataObject.length; j++) {
		var flag = false;
		for (var i = 0; i < requriedFields.length; i++) {
			if (requriedFields[i]===dataObject[j]) flag = true;
		}
		if (flag !== true) return false;
	}
	return true;
};
/**
 * Проверяет подходит ли значение под возможные варинаты
 * @param  {Array} dataObject
 * @param  {Array} possibleValues
 * @return {Boolean}
 */
module.exports.possibleValues = function (dataObject, possibleValues) {
	for (var key = 0; key < dataObject.length; key++) {
		//TODO улучшить через every
		//если не определенная переменная
		if (dataObject[key] === undefined) return true;
		for (var i = 0; i < possibleValues[key].length; i++) {
			if (dataObject[key] === possibleValues[key][i]) return true;
		}
	}
	return false;
}
/**
 * Проверяет содержится ли значение value в массиве dataArray
 * @param  {String}  value
 * @param  {Array}  dataArray
 * @return {Boolean}
 */
module.exports.isEntry = function (value, dataArray) {
	//на тот случай если dataArray не окажется массивом
	//преобразуем в массив
	if (!(dataArray instanceof Array)) dataArray = [dataArray];

	for (var i = 0; i < dataArray.length; i++) {
		if (value === dataArray[i]) return true;
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
		message: "Дублирующася запись в таблицу"
	},
	norecord: {
		code: 1,
		message: "Такой записи в таблице нет"
	},
	semantic: {
		code: 3,
		message: "Семантическая ошибка запроса"
	},
	notWrite: {
		code: 1,
		message: "Ошибка записи, почему-то не записалось(("
	},
	notMemory: {
		code: 4,
		message: "Алфавита не хватает для записи постов в этот уровень"
	}
};
/**
 * Интерпритатор ошибок из mysql
 * @param  {Number} errCode код ошибки из mysql
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
		case 1327:
			return this.errors.semantic;
			break;
		default:
			//console.log(errCode);
			return this.errors.unknown;
			break;
	}
}
