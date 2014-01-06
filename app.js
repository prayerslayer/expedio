var express = require( "express" ),
	path = require( "path" ),
	Q = require( "q" ),
	app = express(),
	_ = require( "underscore" ),
	db = require( "./db" ),
	expedia = require( "./expedia" );

process.on( "uncaughtException", function (err) {
	console.log( err );
});

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
	expedia.disambiguate( req.params.place ).then( function( data ) {
		res.send( 200, data );
	});
});

app.get( "/search/?", function( req, res ) {

	expedia.fetchSearchResults( req.query.where, req.query.from, req.query.to ).then( function( data ) {
		_.each( data.HotelListResponse.HotelList.HotelSummary, function( hotel ) {
			funcs.push( db.fetchHotel( hotel.hotelId ) );
		});

		Q.all( funcs ).then( function( hotels ) {
			response.push.apply( response, hotels );
			res.send( 200, response );
		});
	});
});

app.get( "/", function( req, res ) {
	res.render( "layout" );
});

app.listen( app.get( "port" ) );
console.log( "Server listening on " + app.get( "port" ) );