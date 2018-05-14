var log4js = require('log4js');
log4js.configure({
	appenders: {
		ruleConsole: {
			type: 'console'
		},
		ruleFile: {
			type: 'dateFile',
			filename: 'logs/weixin_',
			pattern: 'yyyy-MM-dd.log',
			maxLogSize: 10 * 1000 * 1000,
			numBackups: 3,
			alwaysIncludePattern: true
		}
	},

	categories: {
		default: {
			appenders: ['ruleConsole', 'ruleFile'],
			level: 'info'
		}
	}
});

var logger = log4js.getLogger('normal');
var JDCardFile = './jdCardData.txt';

module.exports = {

	summary: 'Michael Sun 京东卡程序',

	* beforeSendRequest(requestDetail) {
		if (requestDetail.requestOptions.hostname == 'sgqjd') {
			if (requestDetail.requestOptions.path.indexOf('getcard') != -1) {
				var date = new Date();
				dumpInfo('    ');
				dumpInfo('    ');
				dumpInfo('>>>>>>>>>>>>>>>>>>>>>>>>>>>  BEGIN BINDING <<<<<<<<<<<<<<<<<<<<<<<');
				var card = getUnBindJDCard();
				if (card == '') {
					card = 'NONE';
				}

				return {
					response: {
						statusCode: 200,
						header: {
							'content-type': 'text/html'
						},
						body: card
					}
				};

			} else if (requestDetail.requestOptions.path.indexOf('bindSuccess') != -1) {
				dumpInfo(requestDetail.url);
				var date = new Date();
				var splitedStr = requestDetail.requestOptions.path.split('=');
				handleBindingSuccess(splitedStr[1]);

				dumpInfo('>>>>>>>>>>>>>>>>>>>>>>>>>>>  END SUCCESS BINDING : ' + splitedStr[1] + " <<<<<<<<<<<<<<<<<<<<<<<");
				dumpInfo('    ');
				dumpInfo('    ');


				return {
					response: {
						statusCode: 200,
						header: {
							'content-type': 'text/html'
						},
						body: 'success'
					}
				};
			} else if (requestDetail.requestOptions.path.indexOf('bindFailed') != -1) {
				dumpInfo(requestDetail.url);
				var date = new Date();
				var splitedStr = requestDetail.requestOptions.path.split('=');
				handleBindingFailed(splitedStr[1]);

				dumpInfo('>>>>>>>>>>>>>>>>>>>>>>>>>>>  END FAILED BINDING : ' + splitedStr[1] + " <<<<<<<<<<<<<<<<<<<<<<<");
				dumpInfo('    ');
				dumpInfo('    ');


				return {
					response: {
						statusCode: 200,
						header: {
							'content-type': 'text/html'
						},
						body: 'failed'
					}
				};
			}
		}

		return null;
	},


	* beforeSendResponse(requestDetail, responseDetail) {
		return null;
	},

};

/**
 ** code by sgq
 **/

function JDCardClass() {
	var count = 0;
	var bindSuccess = 0;
	var unBindArray = [];
	var bindSuccessArray = [];
	var bindFailedArray = [];
}

function getUnBindJDCard() {
	var fs = require('fs');
	var jdCard = new JDCardClass();
	var dataSync = JSON.stringify(new JDCardClass());
	try {
		fs.statSync(JDCardFile);
		dataSync = fs.readFileSync(JDCardFile, "utf8");
	} catch (e) {
		console.log(e);
	}

	jdCard = JSON.parse(dataSync);
	var retCardCode = '';
	if (jdCard.count > 0) {
		if (jdCard.unBindArray.length > 0) {
			retCardCode = jdCard.unBindArray[0];
			logger.info('有京东卡需要绑定，开始尝试绑定京东卡 : ' + retCardCode);
		} else {
			logger.info('');
			logger.info('');
			logger.info('京东卡号已经全部绑定完成，检查log文件确认绑定效果, 绑定成功数量 : ' + jdCard.bindSuccess);
			logger.info('');
			logger.info('');
		}
	} else {
		logger.error('No JD Card in database need to be binded...');
	}

	return retCardCode;
}

function handleBindingSuccess(cardcode) {
	var fs = require('fs');
	var jdCard = new JDCardClass();
	var dataSync = JSON.stringify(new JDCardClass());
	try {
		fs.statSync(JDCardFile);
		dataSync = fs.readFileSync(JDCardFile, "utf8");
	} catch (e) {
		console.log(e);
	}
	var findCard = false;
	jdCard = JSON.parse(dataSync);
	if (jdCard.count > 0) {
		for (var index in jdCard.unBindArray) {
			if (jdCard.unBindArray[index] == cardcode) {
				findCard = true;
			}
		}
	} else {
		logger.error('No JD Card in database need to be binded...');
	}

	if (findCard) {
		logger.info('绑定京东卡成功，将此卡从数据库待绑定中移除...，卡号 : ' + cardcode);

	} else {
		logger.error('绑定成功的京东卡，没有在数据库中找到，有问题...，卡号 : ' + cardcode);
	}

	jdCard.unBindArray.remove(cardcode);
	jdCard.bindSuccessArray.push(cardcode);
	jdCard.bindSuccess = jdCard.bindSuccess + 1;

	saveDataToFile(JDCardFile, JSON.stringify(jdCardClass, 2, 2));
	logger.info('绑定京东卡 [[成功]]，并更新数据库成功，卡号 : ' + cardcode);
}

function handleBindingFailed(cardcode) {
	var fs = require('fs');
	var jdCard = new JDCardClass();
	var dataSync = JSON.stringify(new JDCardClass());
	try {
		fs.statSync(JDCardFile);
		dataSync = fs.readFileSync(JDCardFile, "utf8");
	} catch (e) {
		console.log(e);
	}
	var findCard = false;
	jdCard = JSON.parse(dataSync);
	if (jdCard.count > 0) {
		for (var index in jdCard.unBindArray) {
			if (jdCard.unBindArray[index] == cardcode) {
				findCard = true;
			}
		}
	} else {
		logger.error('No JD Card in database need to be binded...');
	}

	if (findCard) {
		logger.info('绑定京东卡失败，将此卡从数据库待绑定中移除, 放入绑定失败列表, 卡号 : ' + cardcode);

	} else {
		logger.error('绑定失败的京东卡，没有在数据库中找到，有问题...，卡号 : ' + cardcode);
	}

	jdCard.unBindArray.remove(cardcode);
	jdCard.bindFailedArray.push(cardcode);

	saveDataToFile(JDCardFile, JSON.stringify(jdCardClass, 2, 2));
	logger.info('绑定京东卡 [[失败]]，并更新数据库成功，卡号 : ' + cardcode);
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

function dumpInfo(str) {
	var infoHead = '[[DUMP INFO]] : ';
	console.log(infoHead + str);
	logger.info(str);
};


function mkdir(dirpath, dirname) {
	var fs = require('fs');
	var path = require('path');
	//判断是否是第一次调用  
	if (typeof dirname === "undefined") {
		if (fs.existsSync(dirpath)) {
			return;
		} else {
			mkdir(dirpath, path.dirname(dirpath));
		}
	} else {
		//判断第二个参数是否正常，避免调用时传入错误参数  
		if (dirname !== path.dirname(dirpath)) {
			mkdir(dirpath);
			return;
		}
		if (fs.existsSync(dirname)) {
			fs.mkdirSync(dirpath)
		} else {
			mkdir(dirname, path.dirname(dirname));
			fs.mkdirSync(dirpath);
		}
	}
};


Array.prototype.indexOf = function(val) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] == val) return i;
	}
	return -1;
};

Array.prototype.remove = function(val) {
	var index = this.indexOf(val);
	if (index > -1) {
		this.splice(index, 1);
	}
};

Date.prototype.pattern = function(fmt) {
	var o = {
		"M+": this.getMonth() + 1, //月份         
		"d+": this.getDate(), //日         
		"h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //小时         
		"H+": this.getHours(), //小时         
		"m+": this.getMinutes(), //分         
		"s+": this.getSeconds(), //秒         
		"q+": Math.floor((this.getMonth() + 3) / 3), //季度         
		"S": this.getMilliseconds() //毫秒         
	};
	var week = {
		"0": "/u65e5",
		"1": "/u4e00",
		"2": "/u4e8c",
		"3": "/u4e09",
		"4": "/u56db",
		"5": "/u4e94",
		"6": "/u516d"
	};
	if (/(y+)/.test(fmt)) {
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	}
	if (/(E+)/.test(fmt)) {
		fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "/u661f/u671f" : "/u5468") : "") + week[this.getDay() + ""]);
	}
	for (var k in o) {
		if (new RegExp("(" + k + ")").test(fmt)) {
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
		}
	}
	return fmt;
};

//将json发送到服务器，str为json内容，url为历史消息页面地址，path是接收程序的路径和文件名
function HttpPost(str, url, path) {
	var http = require('http');
	var data = {
		// str: encodeURIComponent(str),
		// url: encodeURIComponent(url)
		str: str,
		url: url
	};
	var content = require('querystring').stringify(data);

	var options = {
		method: "POST",
		host: "127.0.0.1", //注意没有http://，这是服务器的域名。
		port: 8008,
		path: "/" + path, //接收程序的路径和文件名
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			"Content-Length": content.length
		}
	};
	// console.log(content);
	console.log("++++++++++++++++++");
	console.log(options);
	var req = http.request(options, function(res) {
		console.log('STATUS:' + res.statusCode);
		//res.setEncoding('utf8');
		res.on('data', function(chunk) {
			console.log('BODY: ' + chunk);
		});
	});
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});
	//加入post数据
	req.write(content);

	req.end();
};


//将json发送到服务器，str为json内容，url为历史消息页面地址，path是接收程序的路径和文件名
function HttpPost(str, url, path) {
	var http = require('http');
	var data = {
		// str: encodeURIComponent(str),
		// url: encodeURIComponent(url)
		str: str,
		url: url
	};
	var content = require('querystring').stringify(data);

	var options = {
		method: "POST",
		host: "127.0.0.1", //注意没有http://，这是服务器的域名。
		port: 8008,
		path: "/" + path, //接收程序的路径和文件名
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			"Content-Length": content.length
		}
	};
	// console.log(content);
	console.log("++++++++++++++++++");
	console.log(options);
	var req = http.request(options, function(res) {
		console.log('STATUS:' + res.statusCode);
		//res.setEncoding('utf8');
		res.on('data', function(chunk) {
			console.log('BODY: ' + chunk);
		});
	});
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});
	//加入post数据
	req.write(content);

	req.end();
}