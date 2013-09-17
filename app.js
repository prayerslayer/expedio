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

mongo.connect( "mongodb://localhost/test" ); // TODO how to create new database?
var imgSchema = null;
var db = mongo.connection;
db.once( "open", function( ) {
	imgSchema = mongo.Schema({
		"hotelId": String,
		"url": String //TODO binary data for image missing
	});
});

// Job Queue stuff

jobs.on('job complete', function(id){
	Job.get(id, function(err, job){
		if (err) return;
		job.remove( function(err) { 
			if (err) throw err;
			console.log('removed completed job #%d', job.id);
		});
	});
});

jobs.process( "fetch room images", function( job, done ) {
	http.get( "http://api.ean.com/ean‑services/rs/hotel/v3/roomImages?" + 
			"hotelId=" + job.hotelId + 
			"&apiKey=" + process.env.EAN_KEY, function( res ) {
		var body = "";
		res.on( "data", function( chunk ) {
			body += chunk;
		});
		res.on( "end", function( chunk ) {
			body += chunk;
			var data = JSON.parse( body );
			// we're done if there are no images
			if ( !data.HotelRoomImageResponse.RoomImages.@size )
				done();
			// else loop through images and save them to mongo
			_.each( data.HotelRoomImageResponse.RoomImages.RoomImage, function( img ) {
				// TODO!
			});
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
					exp_res.on("data", function(chunk) {
						body += chunk;
					});
					exp_res.on( "end", function( chunk ) {
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
					exp_res.on("data", function(chunk) {
						body += chunk;
					});
					exp_res.on( "end", function( chunk ) {
						body += chunk;
						// send response to client
						res.send( 200, body );

						// start background jobs
						var data = JSON.parse( body );
						_.each( data.HotelListResponse.HotelList.HotelSummary, function( hotel ) {
							var bgjob = jobs.create( "fetch room images", {
								"hotelId": hotel.hotelId
							}).save();
						});
						
					});
				});
});

app.get( "/", function( req, res ) {
	res.render( "layout" );
});

app.listen( process.env.PORT );