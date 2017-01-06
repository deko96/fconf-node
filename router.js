var url = require("url"),
	qs = require('querystring');

var i18n = require('i18n');
var myLib = require("./myLib");

exports.route = function route(apiHandlers, request, response, www) {
	var ip = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.connection.remoteAddress;
	var urlParts = url.parse(request.url);
	var path = urlParts.pathname.substr(1).split('/');

	if (typeof apiHandlers[path[0]][path[1]] !== 'function') {
		console.error(ip + "\t  __ ======\n=" + new Date().toISOString() + ' = ' + request.url);
		myLib.httpGeneric(404, "not found", response, "ERROR::router - no request handler found for " + urlParts.pathname);
	} else {
		// DEBUG LOG, temp
		requestParams = request.url.split(/[&?]/);
		console.error(ip + "\t  __ ======\n=" + new Date().toISOString() + ' = ' + requestParams.join("   "));
		var apiHandler = apiHandlers[path[0]][path[1]];
		if (request.method === 'POST') {
			var body = '';
			request.on('data', function (data) {
				body += data;
				// Too much POST data, kill the connection!
				if (body.length > 1e6) {
					console.error('ERROR::router - POST OVERDOSE');
					request.connection.destroy();
				}
			});
			request.on('end', function () {
				console.error('post body:', body);
				apiHandler(JSON.parse(body.toString()), response); //assume content-type is application/json
				//apiHandler[path](response, qs.parse(body.toString()));
			});
			request.on('error', function(e) { myLib.httpGeneric(503, 'Internal error', response, "ERROR::router POST - " + e.message); });
		} else {
			var params = qs.parse(urlParts.query);
			if (params.lang) { // && i18n.getLocales().indexOf(params.lang) > -1) {
				i18n.init(request, response);
				response.setLocale(params.lang);
			}
			apiHandler(params, response);
		}
	}
};
