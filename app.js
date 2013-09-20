var express = require( 'express' ),
	http = require( "http" ),
	path = require( "path" ),
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
var ImgSchema = null,
	Img = null,
	db = mongo.connection;
db.once( "open", function( err ) {
	console.log( "Opened mongo, defining schema and model" );
	ImgSchema = mongo.Schema({
		"hotelId": Number,
		"roomCode": Number,
		"url": String
	});
	Img = mongo.model( "Img", ImgSchema );
});

// Job Queue stuff

jobs.on('job complete', function( id ){
	Job.get( id, function( err, job ){
		if ( err )
			console.log( err );
		return;
		job.remove( function( err ) {
			console.log( "Error at removing: " + err ); 
			if ( err )
				throw err;
			console.log('removed completed job #%d', job.id);
			//TODO inform clients via socket
		});
	});
});

jobs.process( "fetch room images", function( job, done ) {
	console.log( "Fetching room images for " + job.data.hotelId );
	http.get({
				"host": "api.ean.com",
				"path": "/ean‑services/rs/hotel/v3/roomImages?hotelId=" + job.data.hotelId + "&apiKey=" + process.env.EAN_KEY,
				"headers": {
					"accept": "application/json, text/javascript, */*"
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
			console.log( "Got response for " + job.data.hotelId + ": " + body.substring( 0,16 ) + "..." );
			if ( body.indexOf("<") === 0) {
				done( new Error( "Invalid JSON response.", body ) );
				return;
			}
			var data = JSON.parse( body );

			// we're done if there are no images
			if ( !data.HotelRoomImageResponse.RoomImages["@size"] )
				done();
			// else loop through images and save them to mongo
			_.each( data.HotelRoomImageResponse.RoomImages.RoomImage, function( img ) {
				//check if this image is in database
				Img.find({
					"hotelId": job.data.hotelId,
					"url": img.url,
					"roomCode": img.roomTypeCode
				}, function( err, imgs ) {
					// break if there are room images
					if ( imgs.length )
						return;
					//TODO check if image is different from that in db

					// save new room image
					var roomImg = new Img({
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
					exp_res.on("data", function(chunk) {
						body += chunk;
					});
					exp_res.on( "end", function( ) {
						//TODO check if hotel has images in db

						// send response to client
						res.send( 200, body );
						
						// start background jobs
						var data = JSON.parse( body );
						_.each( data.HotelListResponse.HotelList.HotelSummary, function( hotel ) {
							jobs.create( "fetch room images", {
								"hotelId": hotel.hotelId
							}).save();
						});
						
					});
				});
});

app.get( "/", function( req, res ) {
	res.render( "layout" );
});

app.listen( app.get( "port" ) );
console.log( "Server listening on " + app.get( "port" ) );