exports.setUp = function( cb ) {
	console.log( "setup" );
	cb();
};

exports["you are my favorite unit framework"] = function( test ) {
	console.log( "i <3 you you so much" );
	test.ok( true, "this value is true" );
	test.done();
};

exports.tearDown = function( cb ) {
	console.log( "teardown" );
	cb();
};