// var TMClient = require('textmagic-rest-client');
  
// var c = new TMClient('Nick Gattuso', '680db61e0ce0c769');
// c.Messages.send({text: 'test message', phones:'9089101254'}, function(err, res){
//     console.log('Messages.send()', err, res);
// });

var schedule = require('node-schedule');
var request = require('request');
var https = require('https');
var async = require('async');
var PropertiesReader = require('properties-reader');

var properties = PropertiesReader('props.ini');

var key = properties.get('api.key');
var secret = properties.get('api.secret');
var to_number = properties.get('numbers.to');
var from_number = properties.get('numbers.from');

var time = {
	hour: properties.get('time.hour'),
	minutes: properties.get('time.minutes')
}

var index_properties = PropertiesReader('indexes.ini');

var index_array = [];

for(var x=0;x<index_properties.length;x++){
	index_array.push(index_properties.get('indexes.' + x));
}


function send_message(message){
	var data = JSON.stringify({
	 api_key: key,
	 api_secret: secret,
	 to: to_number,
	 from: from_number,
	 text: message
	});

	var options = {
	 host: 'rest.nexmo.com',
	 path: '/sms/json',
	 port: 443,
	 method: 'POST',
	 headers: {
	   'Content-Type': 'application/json',
	   'Content-Length': Buffer.byteLength(data)
	 }
	};

	var req = https.request(options);

	req.write(data);
	req.end();

	var responseData = '';
	req.on('response', function(res){
	 res.on('data', function(chunk){
	   responseData += chunk;
	 });

	 res.on('end', function(){
	   console.log(JSON.parse(responseData));
	 });
	});
}

var the_requests = function(index,doneCallback){
	request.get({
      url: 'https://api.gdax.com/products/' + index + '/stats',
      headers: {
         'User-Agent': 'cryptopredictor node.js"'
      }
   	}, function(error, response, body) {
   		var json = JSON.parse(body);
   		json.index = index;
   		doneCallback(null,json)
   	});
}

function get_GDAX_data(){
	
	async.map(index_array, the_requests, function (err,result) {
		console.log(result)
		return result;
	});

}

var j = schedule.scheduleJob(time, function(){
    var message = get_GDAX_data();
    send_message(message);
});

var k = schedule.scheduleJob('*/5 * * * *', function(){
	get_GDAX_data();
});

