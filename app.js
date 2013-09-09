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
	app.use( app.router );
	app.use( express.static(  path.join( __dirname, 'public' ) ) );
});

app.get( "/search/?", function( req, res ) {
	http.get( "http://api.ean.com/ean-services/rs/hotel/v3/list?" +
				"destinationString=" + encodeURIComponent( req.query[ "where"] ) +
				"&cid=55505" +
				"&minorRev=20" +
				"&arrivalDate=" + req.query[ "from" ] + 
				"&departureDate=" + req.query[ "to" ] + 
				"&room1=2" +
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