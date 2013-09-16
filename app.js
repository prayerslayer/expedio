var express = require( 'express' ),
	http = require( "http" ),
	path = require( "path" ),
	app = express();

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
						//TODO hier background job starten, der bilder von http://api.ean.com/ean‑services/rs/hotel/v3/roomImages sammelt
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
						res.send( 200, body );
					});
				});
});

app.get( "/", function( req, res ) {
	res.render( "layout" );
});

app.listen( process.env.PORT );