var kue = require( "kue" ),
	http = require( "http" ),
	jobs = kue.createQueue(),
	Q = require( "Q" ),
	_ = require( "underscore" ),
	mongo = require( "mongoose" ),
	HotelSchema = null,
	Hotel = null,
	HotelImgSchema = null,
	HotelImg = null,
	db = null;

// QUEUE STUFF

jobs.on( "job complete", function( id ){
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
});



jobs.process( "fetch hotel info", function( job, done ) {
	console.log( "Fetching hotel info for " + job.data.hotelId );
	http.get({
		"host": "api.ean.com",
		"path": "/ean-services/rs/hotel/v3/info?cid=55505&hotelId=" + job.data.hotelId + "&apiKey=" + process.env.EAN_KEY,
		"headers": {
			"accept": "application/json"
		}
	}, function( res ) {
		var body = "";
		res.on( "error", function( err ) {
			console.log( err );
		});
		res.on( "data", function( chunk ) {
			body += chunk;
		});
		res.on( "end", function( ) {
			console.log( "Got response for " + job.data.hotelId + ": " + body );
			// check if it returned actually JSON
			if ( body.indexOf( "<" ) === 0 ) {
				done();
			}
			// parse data
			var data = JSON.parse( body ).HotelInformationResponse;
			// general hotel info
			var hotel = new Hotel({
				"hotelId": job.data.hotelId,
				"name": data.HotelSummary.name,
				"checkInTime": data.HotelDetails.checkInTime,
				"checkOutTime": data.HotelDetails.checkOutTime,
				"locationDescription": data.HotelSummary.locationDescription,
				"latitude": data.HotelSummary.latitude,
				"longitude": data.HotelSummary.longitude,
				"lowRate": data.HotelSummary.lowRate,
				"highRate": data.HotelSummary.highRate,
				"tripAdvisorRating": data.HotelSummary.tripAdvisorRating
			});
			hotel.save();

			// hotel images
			if ( data.HotelImages["@size"] > 0 ) {
				_.each( data.HotelImages.HotelImage, function( hotelimg ) {
					var hotelImg = new HotelImg({
						"hotelId": job.data.hotelId,
						"caption": hotelimg.caption,
						"full_url": hotelimg.url,
						"thumb_url": hotelimg.thumbnailUrl
					});
					hotelImg.save();
				});
			}

			done();
		});
	});
});

// DB STUFF


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
		// hotel information
		HotelSchema = mongo.Schema({
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
		Hotel = mongo.model( "Hotel", HotelSchema );

		// hotel images
		HotelImgSchema = mongo.Schema({
			"hotelId": Number,
			"caption": String,
			"full_url": String,
			"thumb_url": String
		});
		HotelImg = mongo.model( "HotelImg", HotelImgSchema );
		// TODO room images

		promise.resolve();
	});

	return promise.promise;
};

/*
*	Fetches information about a hotel and its images from mongodb.
*/
exports.fetchHotel = function( hotelId ) {
	var hotelParameter = { "hotelId": hotelId },
		promise = Q.defer(),
		that = this;

	Q
	.ninvoke( HotelImg, "find", hotelParameter )
	.then( function( databaseImages ) {
		Q
		.ninvoke( Hotel, "find", hotelParameter )
		.then( function( databaseHotels ) {
			// no such hotel
			if ( !databaseHotels.length ) {
				// start background job to add this hotel instead
				var job = jobs.create( "fetch hotel info", hotelParameter ).save();
				job.on( "complete", function() {
					that.fetchHotel( hotelId ).then( function( hotel ) {
						promise.resolve( hotel );
					});
				});
			} else {
				var response = databaseHotels[ 0 ].toObject();
				response.images = databaseImages;
				promise.resolve( response );
			}
		});
	});

	return promise.promise;
};