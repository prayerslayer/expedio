var kue = require( "kue" ),
	jobs = kue.createQueue(),
	Q = require( "Q" ),
	_ = require( "underscore" ),
	mongo = require( "mongoose" ),
	expedia = require( "./expedia" ),
	db = null,
	schemas = {
		HotelSchema: null,
		Hotel: null,
		HotelImgSchema: null,
		HotelImg: null
		// TODO room images
	};

exports.schema = schemas;
kue.app.listen( process.env.QUEUE_PORT );

// QUEUE STUFF

/*jobs.on( "job complete", function( id ){
	kue.Job.get( id, function( err, job ){
		if ( err ) {
			console.log( err );
			return;
		}
		job.remove( function( erreur ) {
			if ( erreur ) {
				console.log( "Error at removing: " + erreur );
				throw erreur;
			} else {
				console.log( "removed completed job #%d", job.id);
			}
		});
	});
});*/



jobs.process( "fetch hotel info", function( job, done ) {
	if ( process.env.DEVELOPMENT ) {
		console.log( "Fetching hotel info for " + job.data.hotelId );
	}
	expedia.fetchHotelInfo( job.data.hotelId ).then( function( data ) {
		console.log( "got hotel from expedia" );
		// general hotel info
		var hotel = new schemas.Hotel({
			"hotelId": job.data.hotelId,
			"name": data.name,
			// "checkInTime": data.HotelDetails.checkInTime,
			// "checkOutTime": data.HotelDetails.checkOutTime,
			"locationDescription": data.location.description,
			"latitude": data.location.latitude,
			"longitude": data.location.longitude,
			"lowRate": data.pricing.low,
			"highRate": data.pricing.high,
			"tripAdvisorRating": data.rating.taRating
		});
		hotel.save();

		// hotel images
		if ( data.images.length > 0 ) {
			_.each( data.images, function( hotelimg ) {
				var hotelImg = new schemas.HotelImg({
					"hotelId": job.data.hotelId,
					"caption": hotelimg.caption,
					"full_url": hotelimg.url,
					"thumb_url": hotelimg.thumbnail
				});
				hotelImg.save();
			});
		}
		setTimeout( done, 1000 );
	}).fail( function( err ) {
		done( err );
	});
});

// DB STUFF

/*
 * Closes connectoin
 */
exports.disconnect = function() {
	mongo.disconnect();
};

/*
 * Connects to mongodb
 */
exports.connect = function() {
	var promise = Q.defer();

	mongo.connect( "mongodb://" + process.env.MONGO_SERVER + "/" + process.env.MONGO_DB );
	db = mongo.connection;

	db.once( "open", function( err ) {

		if ( err ) {
			promise.reject( err );
		}

		console.log( "Opened mongo, defining schema and model" );
		if ( !schemas.HotelSchema ) {
			// hotel information
			schemas.HotelSchema = mongo.Schema({
				"hotelId": Number,
				"name": String,
				"checkInTime": String,
				"checkOutTime": String,
				"locationDescription": String,
				"latitude": Number,
				"longitude": Number,
				"lowRate": Number,
				"highRate": Number,
				"tripAdvisorRating": Number
			});
			schemas.Hotel = mongo.model( "Hotel", schemas.HotelSchema );

			// hotel images
			schemas.HotelImgSchema = mongo.Schema({
				"hotelId": Number,
				"caption": String,
				"full_url": String,
				"thumb_url": String
			});
			schemas.HotelImg = mongo.model( "HotelImg", schemas.HotelImgSchema );
			
			// TODO room images

			console.log( "sucessfully connected and created models" );
		}
		promise.resolve();
	});

	return promise.promise;
};

/*
*	Fetches information about a hotel and its images from mongodb.
*/
exports.fetchHotel = function( hotelId ) {
	if ( process.env.DEVELOPMENT ) {
		console.log( "Fetching hotel from db", hotelId );
	}
	var hotelParameter = { "hotelId": hotelId },
		promise = Q.defer(),
		that = this;

	Q
	.ninvoke( schemas.HotelImg, "find", hotelParameter )
	.then( function( databaseImages ) {
		Q
		.ninvoke( schemas.Hotel, "find", hotelParameter )
		.then( function( databaseHotels ) {
			// no such hotel
			if ( !databaseHotels.length ) {
				if ( process.env.DEVELOPMENT ) {
					console.log( "no hotels - creating job" );
				}
				// start background job to add this hotel instead
				var job = jobs.create( "fetch hotel info", hotelParameter ).save();
				job.on( "complete", function() {
					// now the hotel is in the db and we can savely fetch it
					that.fetchHotel( hotelId ).then( function( hotel ) {
						promise.resolve( hotel );
					});
				});
				job.on( "failed", function( err ) {
					promise.reject( err );
				});
			} else {
				if ( process.env.DEVELOPMENT ) {
					console.log( "got all information for hotel", hotelId );
				}
				var response = databaseHotels[ 0 ].toObject();
				response.images = databaseImages;
				setTimeout( function() {
					promise.resolve( response );
				}, 1000 );
			}
		})
		.fail( function( err ) {
			console.error( "Failed fetching hotel " + hotelId + " from DB", err );
			promise.reject( err );
		});
	})
	.fail( function(err) {
		console.error( "Failed fetching hotel images " + hotelId + " from DB", err );
		promise.reject( err );
	});

	return promise.promise;
};