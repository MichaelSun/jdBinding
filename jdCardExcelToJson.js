var XLSX = require("xlsx")
const workbook = XLSX.readFile('jdCardData.xlsx');


function to_json(workbook) {
	var result = {};
	// 获取 Excel 中所有表名
	var sheetNames = workbook.SheetNames;
	workbook.SheetNames.forEach(function(sheetName) {
		var worksheet = workbook.Sheets[sheetName];
		result[sheetName] = XLSX.utils.sheet_to_json(worksheet);
	});
	console.log("打印表信息", JSON.stringify(result, 2, 2));
	// console.log(JSON.stringify(result));
	return result;
}

function saveDataToFile(filename, str) {
	var fs = require("fs");
	try {
		fs.statSync(filename);
		fs.unlinkSync(filename);
	} catch (e) {
		console.log(e);
	}
	var options = {
		encoding: 'utf8',
		flag: 'a'
	};
	fs.writeFileSync(filename, str + '\n', options);
}

function parseExcelDataToDictMap(workbook) {
	var contentMap = {};
	var result = {};
	var sheetNames = workbook.SheetNames;
	var saveJsonStr = '';
	workbook.SheetNames.forEach(function(sheetName) {
		var worksheet = workbook.Sheets[sheetName];
		result[sheetName] = XLSX.utils.sheet_to_json(worksheet);

		if (result[sheetName] != []) {
			for (var objIndex in result[sheetName]) {
				var obj = result[sheetName][objIndex];
				for (var key in obj) {
					if (contentMap[key] != null) {
						var content = obj[key].replace(/\r\n/g, '');
						contentMap[key].push(content);
					} else {
						var content = obj[key].replace(/\r\n/g, '');
						contentMap[key] = [content];
					}
				}
			}
		}
	});

	return contentMap;
}

function JDCardClass() {
	var count = 0;
	var bindSuccess = 0;
	var unBindArray = [];
	var bindArray = [];
}

function excelToJsonFile(workbook, filename) {
	var jdCardMap = parseExcelDataToDictMap(workbook);

	//log 
	var saveStr = JSON.stringify(jdCardMap, 2, 2);
	console.log(saveStr);

	var jdCardArray = [];
	for (var key in jdCardMap) {
		for (var dataIndex in jdCardMap[key]) {
			jdCardArray.push(jdCardMap[key][dataIndex]);	
		}
	}

	var jdCardClass = new JDCardClass();
	jdCardClass.count = jdCardArray.length;
	jdCardClass.bindSuccess = 0;
	jdCardClass.unBindArray = jdCardArray;
	jdCardClass.bindArray = [];

	saveDataToFile(filename, JSON.stringify(jdCardClass, 2, 2));

	console.log('  ');
	console.log('  ');
	console.log('>>>>>>>>>> 解析京东卡到: ' +  filename + ', 总计: ' + jdCardClass.count + '张卡 <<<<<<<<<');
	console.log('  ');
	console.log('  ');
}

//to_json(workbook);
excelToJsonFile(workbook, './jdCardData.txt');