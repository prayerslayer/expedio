var db = require( "../db" ),
	existingHotel = 139372,
	missingHotel = 189753;

exports.setUp = function( callback ) {
	//TODO flush redis
	console.log( "setting up..." );

	// connect to database
	db.connect().then( function() {
		console.log( "connected in test ");
		// remove hotels
		db.schema.Hotel.find({
			"hotelId": {
				"$in": [ existingHotel, missingHotel ]
			}
		}).remove();
		// save hotel
		db.fetchHotel( existingHotel ).then( function() {
			console.log( "setup finished" );
			callback();
		});
	});
};

exports[ "check existence of hotel" ] = function( test ) {
	console.log( "testing existence" );
	db.schema.Hotel.find({
		"hotelId": existingHotel
	}, function( err, hotels ) {
		if ( err ) {
			test.ok( false, err );
		}
		console.log( "found existing hotel, checking..." );
		test.ok( hotels.length === 1, "there is one hotel in db" );
		test.ok( hotels[ 0 ].hotelId === existingHotel, "and its id is fine" );
		test.done();
		console.log( "done called" );
	});
};

exports[ "save unexisting hotel" ] = function( test ) {
	console.log( "testing saving" );
	db.schema.Hotel.find({
		"hotelId": missingHotel
	}, function( err1, hotels ) {
		if ( err1 ) {
			test.ok( false, err );
		}
		test.ok( hotels.length === 0, "missing hotel is missing" );

		db.fetchHotel( missingHotel ).then( function() {
			db.schema.Hotel.find({
				"hotelId": missingHotel
			}, function( err2, newHotels ) {
				if ( err2 ) {
					test.ok( false, err2 );
				}
				test.ok( newHotels.length === 1, "missing hotel is not missing anymore" );
				test.done();
			});
		});
	});
};

exports[ "update existing hotel" ] = function( test ) {
	test.done();
};

exports.tearDown = function( cb ) {
	console.log( "clearing up" );
	//TODO tear down
	db.disconnect();
	cb();
};