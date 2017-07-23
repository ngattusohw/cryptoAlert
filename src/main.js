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
	minute: properties.get('time.minutes')
}

function Indexes(name,high,low){
	this.name = name;
	this.high = high;
	this.low = low;
}

var index_properties = PropertiesReader('indexes.ini');
var amount = index_properties.get('indexes.amount');
console.log("The amount " + amount);

var index_array = [];

for(var x=0;x<amount;x++){
	index_array.push(new Indexes(index_properties.get('indexes.' + x)
		,index_properties.get(x + '.high')
		,index_properties.get(x + '.low')));
	console.log(index_array[x]);
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
      url: 'https://api.gdax.com/products/' + index.name + '/stats',
      headers: {
         'User-Agent': 'cryptopredictor node.js"'
      }
   	}, function(error, response, body) {
   		var json = JSON.parse(body);
   		json.index = index.name;
   		doneCallback(null,json)
   	});
}

function get_GDAX_data(doneCallback){
	
	async.map(index_array, the_requests, function (err,result) {
		console.log(result)
		return doneCallback(result);
	});

}

var j = schedule.scheduleJob(time, function(){
    get_GDAX_data(function(result){
    	var hold = result;
    	var message = "";
    	for(var i in hold){
    		message+= "\n Index: " + hold[i].index + " Recent: " + 
					hold[i].last + " High: " + hold[i].high + " Low: " +
					hold[i].low;
    	}
    	console.log(" This is my message" + message);
    	console.log(hold);
    	send_message(message);
    });
    
});

//Change this in the future to be able to specify how often 
//it will check the markets..
//Also need to figure out threshold.. 
 var check = schedule.scheduleJob('*/1 * * * *', function(){

	get_GDAX_data(function(result){
		for(var x in result){
			console.log("In here");
			if(result[x].high >= index_array[x].high){
				var message = "Index: " + result[x].index +
					" has gone over the high limit! Current: " +
					result[x].last;
				send_message(message);
			}
		}
	});
});





