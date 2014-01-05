var express = require( "express" ),
	http = require( "http" ),
	path = require( "path" ),
	Q = require( "q" ),
	app = express(),
	_ = require( "underscore" ),
	db = require( "./db" );

db.connect();

// configure application
app.configure( function() {
	app.set( "port", process.env.PORT );
	app.set( "views", path.join( __dirname, "partials" ) );
	app.set( "view engine", "mmm" );
	app.set( "layout", "layout" );
	app.use( express.favicon() );
	app.use( express.logger( "dev" ) );
	app.use( express.bodyParser() );
	app.use( express.methodOverride() );
	app.use( express.cookieParser( process.env.COOKIE_SECRET ) );
	app.use( app.router );
	app.use( express.static(  path.join( __dirname, "public" ) ) );
});

// API

app.get( "/disambiguate/:place/?", function( req, res ) {
	http.get( "http://api.ean.com/ean-services/rs/hotel/v3/geoSearch?" +
				"type=1" + // only cities
				"&destinationString=" + req.params.place +
				"&apiKey=" + process.env.EAN_KEY,
				function( expediaResponse ) {
					var body = "";
					expediaResponse.on( "error", function( err ) {
						console.log( err );
					});
					expediaResponse.on("data", function(chunk) {
						body += chunk;
					});
					expediaResponse.on( "end", function() {
						res.send( 200, body );
					});
				});
});

app.get( "/search/?", function( req, res ) {

	http.get( "http://api.ean.com/ean-services/rs/hotel/v3/list?" +
				"destinationId=" + encodeURIComponent( req.query.where ) +
				"&cid=55505" +
				"&minorRev=20" +
				"&arrivalDate=" + req.query.from +
				"&departureDate=" + req.query.to +
				"&room1=2" +			// 1 double bed room
				//"&minStarRating=3.0" +	// only better than 
				"&propertyCategory=1" +	// list only hotels
				"&sort=QUALITY" +		// sort by rating
				"&numberOfResults=20" +
				"&apiKey=" + process.env.EAN_KEY,
				function( expediaResponse ) {
					var body = "";
					expediaResponse.on( "error", function( err ) {
						console.log( err );
					});
					expediaResponse.on( "data", function(chunk) {
						body += chunk;
					});
					expediaResponse.on( "end", function( ) {
						
						var data = JSON.parse( body ),
							response = [],
							funcs = [];

						_.each( data.HotelListResponse.HotelList.HotelSummary, function( hotel ) {
							funcs.push( db.fetchHotel( hotel.hotelId ) );
						});

						Q.all( funcs ).then( function( hotels ) {
							response.push.apply( response, hotels );
							res.send( 200, response );
						});
					});
				});
});

app.get( "/", function( req, res ) {
	res.render( "layout" );
});

app.listen( app.get( "port" ) );
console.log( "Server listening on " + app.get( "port" ) );