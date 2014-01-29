var ean = require( "../expedia" ),
	existingHotel = 139372,
	missingHotel = 189753;

exports.setUp = function( cb ) {
	cb();
};

exports.tearDown = function( db ) {
	cb();
};

exports[ "check fetch hotel" ] = function( test ) {
	expedia
	.fetchHotelInfo( existingHotel )
	.then( function( hotel ) {
		test.ok( hotel.images.length === 35 );
	})
	.fail( function( err ) {
		test.ok( false, err );
	});
};