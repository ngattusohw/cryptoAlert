// var TMClient = require('textmagic-rest-client');
  
// var c = new TMClient('Nick Gattuso', '680db61e0ce0c769');
// c.Messages.send({text: 'test message', phones:'9089101254'}, function(err, res){
//     console.log('Messages.send()', err, res);
// });

var request = require('request');

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('props.ini');

var key = properties.get('api.key');
var secret = properties.get('api.secret');
var to_number = properties.get('numbers.to');
var from_number = properties.get('numbers.from');


var https = require('https');

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

function get_GDAX_data(start,end){
	request.get({
      url: 'https://api.gdax.com/products/ETH-USD/stats',
      headers: {
         'User-Agent': 'cryptopredictor node.js"'
      }
   }, function(error, response, body) {
   		var json = JSON.parse(body);
   		console.log(json);
   	});
}

get_GDAX_data('2017-07-011T12:00:00','2017-07-014T12:00:00');
