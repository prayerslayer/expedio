var express = require( 'express' ),
	http = require( "http" ),
	path = require( "path" ),
	Q = require( "q" ),
	app = express(),
	kue = require( "kue" ),
	jobs = kue.createQueue(),
	_ = require( "underscore" ),
	mongo = require( "mongoose" );

// configure application
app.configure( function() {
	app.set( "port", process.env.PORT );
	app.set( 'views', path.join( __dirname, 'partials' ) );
	app.set( 'view engine', 'mmm' );
	app.set( 'layout', 'layout' );
	app.use( express.favicon() );
	app.use( express.logger( 'dev' ) );
	app.use( express.bodyParser() );
	app.use( express.methodOverride() );
	app.use( express.cookieParser( process.env.COOKIE_SECRET ) );
	app.use( app.router );
	app.use( express.static(  path.join( __dirname, 'public' ) ) );
});

// DB stuff

mongo.connect( "mongodb://" + process.env.MONGO_SERVER + "/" + process.env.MONGO_DB );
var HotelSchema = null,
	Hotel = null,
	HotelImgSchema = null,
	HotelImg = null,
	db = mongo.connection;

db.once( "open", function( err ) {
	console.log( "Opened mongo, defining schema and model" );
	// hotel information
	HotelSchema = mongo.Schema({
		"hotelId": Number,
		"name": String,
		"checkInTime": String,
		"checkOutTime": String,
		"locationDescription": String,
		"latitude": Number,
		"longitude": Number,
		"tripAdvisorRating": Number
	});
	Hotel = mongo.model( "Hotel", HotelSchema );

	// hotel images
	HotelImgSchema = mongo.Schema({
		"hotelId": Number,
		"caption": String,
		"full_url": String,
		"thumb_url": String
	});
	HotelImg = mongo.model( "HotelImg", HotelImgSchema );
	// TODO room images

});

// Job Queue stuff

jobs.on( "job complete", function( id ){
	kue.Job.get( id, function( err, job ){
		if ( err ) {
			console.log( err );
			return;
		}
		job.remove( function( erreur ) {
			if ( erreur ) {
				throw erreur;
				console.log( "Error at removing: " + erreur ); 
			} else {
				console.log( "removed completed job #%d", job.id);
			}
			//TODO inform clients via socket
		});
	});
});

jobs.process( "fetch hotel info", function( job, done ) {
	console.log( "Fetching hotel info for " + job.data.hotelId );
	http.get({
		"host": "api.ean.com",
		"path": "/ean-services/rs/hotel/v3/info?cid=55505&hotelId=" + job.data.hotelId + "&apiKey=" + process.env.EAN_KEY,
		"headers": {
			"accept": "application/json"
		}
	}, function( res, a, b ) {
		var body = "";
		res.on( "error", function( err ) {
			console.log( err );
		});
		res.on( "data", function( chunk ) {
			body += chunk;
		});
		res.on( "end", function( ) {
			console.log( "Got response for " + job.data.hotelId + ": " + body );
			// check if it returned actually JSON
			if ( body.indexOf( "<" ) === 0 )
				done();
			// parse data
			var data = JSON.parse( body ).HotelInformationResponse;

			// general hotel info
			var hotel = new Hotel({
				"hotelId": job.data.hotelId,
				"name": data.HotelSummary.name,
				"checkInTime": data.HotelDetails.checkInTime,
				"checkOutTime": data.HotelDetails.checkOutTime,
				"locationDescription": data.HotelSummary.locationDescription,
				"latitude": data.HotelSummary.latitude,
				"longitude": data.HotelSummary.longitude,
				"tripAdvisorRating": data.HotelSummary.tripAdvisorRating
			});
			hotel.save();

			// hotel images
			if ( data.HotelImages["@size"] > 0 ) {
				_.each( data.HotelImages.HotelImage, function( hotelimg, idx ) {
					var hotelImg = new HotelImg({
						"hotelId": job.data.hotelId,
						"caption": hotelimg.caption,
						"full_url": hotelimg.url,
						"thumb_url": hotelimg.thumbnailUrl
					});
					hotelImg.save();
				});
			}

			done();
		});
	});
});
/*
jobs.process( "fetch room images", function( job, done ) {
	console.log( "Fetching room images for " + job.data.hotelId );
	http.get({
				"host": "api.ean.com",
				"path": "/ean-services/rs/hotel/v3/roomImages?cid=55505&hotelId=" + job.data.hotelId + "&apiKey=" + process.env.EAN_KEY,
				"headers": {
					"accept": "application/json"
				}
			}, function( res, a, b ) {
		
		var body = "";
		res.on( "error", function( err ) {
			console.log( err );
		});
		res.on( "data", function( chunk ) {
			body += chunk;
		});
		res.on( "end", function( ) {
			console.log( "Got response for " + job.data.hotelId + ": " + body );
			if ( body.indexOf("<") === 0) {
				done( new Error( "Invalid JSON response.", body ) );
				return;
			}
			var data = JSON.parse( body );
			console.log( JSON.stringify( data ) );
			// look for error
			if ( !data.HotelRoomImageResponse.EanWsError ) {
				done();
			}
			// we're done if there are no images
			if ( !data.HotelRoomImageResponse.RoomImages["@size"] ) {
				done();
			}
			// else loop through images and save them to mongo
			_.each( data.HotelRoomImageResponse.RoomImages.RoomImage, function( img, idx ) {
				//check if this image is in database
				RoomImg.find({
					"hotelId": job.data.hotelId,
					"url": img.url,
					"roomCode": img.roomTypeCode
				}, function( err, imgs ) {
					// break if there are room images
					if ( imgs.length )
						return;
					//TODO check if image is different from that in db
					console.log( "Saving new image" );
					// save new room image
					var roomImg = new RoomImg({
						"hotelId": job.data.hotelId,
						"url": img.url,
						"roomCode": img.roomTypeCode
					});
					roomImg.save();
				});
			});
			//TODO könnte schlecht sein das hier
			done();
		});
	});
});
*/
// API

app.get( "/disambiguate/:place/?", function( req, res ) {
	http.get( "http://api.ean.com/ean-services/rs/hotel/v3/geoSearch?" + 
				"type=1" + // only cities
				"&destinationString=" + req.params.place +
				"&apiKey=" + process.env.EAN_KEY,
				function( exp_res ) {
					var body = "";
					exp_res.on( "error", function( err ) {
						console.log( err );
					});
					exp_res.on("data", function(chunk) {
						body += chunk;
					});
					exp_res.on( "end", function() {
						res.send( 200, body );
					});
				});
});

var fetchHotel = function( hotelId ) {
	var mongo_param = { "hotelId": hotelId },
		promise = Q.defer();

	Q
	.ninvoke( HotelImg, "find", mongo_param )
	.then( function( db_imgs ) {
		Q
		.ninvoke( Hotel, "find", mongo_param )
		.then( function( db_hotels ) {
			var response = db_hotels[ 0 ].toObject();
			response.images = db_imgs;
			console.log( "response " + JSON.stringify( response ) );
			promise.resolve( response );
		});
	});

	return promise.promise;
};

app.get( "/search/?", function( req, res ) {

	http.get( "http://api.ean.com/ean-services/rs/hotel/v3/list?" +
				"destinationId=" + encodeURIComponent( req.query[ "where"] ) +
				"&cid=55505" +
				"&minorRev=20" +
				"&arrivalDate=" + req.query[ "from" ] + 
				"&departureDate=" + req.query[ "to" ] + 
				"&room1=2" +			// 1 double bed room
				//"&minStarRating=3.0" +	// only better than 
				"&propertyCategory=1" + // list only hotels
				"&sort=QUALITY" + 		// sort by rating
				"&numberOfResults=20" + 
				"&apiKey=" + process.env.EAN_KEY, 
				function( exp_res ) {
					var body = "";
					exp_res.on( "error", function( err ) {
						console.log( err );
					});
					exp_res.on( "data", function(chunk) {
						body += chunk;
					});
					exp_res.on( "end", function( ) {
						
						var data = JSON.parse( body ),
							response = [],
							funcs = [];

						_.each( data.HotelListResponse.HotelList.HotelSummary, function( hotel ) {
							funcs.push( fetchHotel( hotel.hotelId ) );
						});

						Q.all( funcs ).then( function( hotels ) {
							console.log( hotels );
						});

						//TODO
						// get mongo with Q to do the following:
						// iterate over hotels in ean response
						// try to find their images in mongo
						// merge them with cached hotel info in mongo
						// all of those objects put in an array
						// return this array to client

						res.send( 200, response );
						
					});
				});
});

app.get( "/", function( req, res ) {
	res.render( "layout" );
});

app.listen( app.get( "port" ) );
console.log( "Server listening on " + app.get( "port" ) );