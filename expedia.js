// modules
var http = require( "http" ),
	Q = require( "q" );

// vars
var host = "api.ean.com",
	hotelPath = "/ean-services/rs/hotel/v3";

// helpers
var isJSON = function( str ) {
				return str.charAt( 0 ) !== "<";	// just prevent html
			};

// api

exports.disambiguate = function( place ) {
	if ( process.env.DEVELOPMENT ) {
		console.log( "Disambiguating", place );
	}
	var promise = Q.defer();
	http.get( "http://" + host + hotelPath + "/geoSearch?" +
				"type=1" + // only cities
				"&destinationString=" + place +
				"&apiKey=" + process.env.EAN_KEY,

		function( expediaResponse ) {
			var body = "";
			expediaResponse.on( "error", function( err ) {
				console.log( err );
				promise.reject( err );
			});
			expediaResponse.on("data", function(chunk) {
				body += chunk;
			});
			expediaResponse.on( "end", function() {
				if ( isJSON( body ) ) {
					promise.resolve( JSON.parse( body ) );
				} else {
					promise.reject( "Reponse is no valid JSON" );
				}
			});
		}
	);
	return promise.promise;
};

exports.normalize = function( eanHotel ) {
	var hotel = {};
	hotel.id = eanHotel["@hotelId"];
	// general information
	(function( hotel, info ) {
		hotel.name = info.name;
		hotel.location = {
			"city": info.city,
			"address": info.address1,
			"postalCode": info.postalCode,
			"countryCode": info.countryCode,
			"latitude": info.latitude,
			"longitude": info.longitude,
			"description": info.locationDescription
		};
		hotel.pricing = {
			"high": info.highRate,
			"low": info.lowRate
		};
		hotel.rating = {
			"stars": info.hotelRating,
			"taRating": info.tripAdvisorRating,
			"taReviews": info.tripAdvisorReviewCount,
			"taRatingUrl": info.tripAdvisorRatingUrl
		};
	})( hotel, eanHotel.HotelInformationResponse.HotelSummary );
	// hotel images
	( function( hotel, imgs ) {
		hotel.images = [];
		imgs.forEach( function( img ) {
			hotel.images.push({
				"caption": img.caption,
				"url": img.url,
				"thumbnail": img.thumbnailUrl,
				"hotelId": hotel.id
			});
		});
	})( hotel, eanHotel.HotelInformationResponse.HotelImages.HotelImage );
	return hotel;
};

exports.fetchHotelInfo = function( hotelId ) {
	if ( process.env.DEVELOPMENT ) {
		console.log( "Fetching hotel", hotelId );
	}
	var promise = Q.defer(),
		that = this;
	http.get({
		"host": host,
		"path": hotelPath + "/info?cid=55505&hotelId=" + hotelId + "&apiKey=" + process.env.EAN_KEY,
		"headers": {
			"accept": "application/json"
		}
	},
		function( res ) {
			var body = "";
			res.on( "error", function( err ) {
				promise.reject( err );
			});
			res.on( "data", function( chunk ) {
				body += chunk;
			});
			res.on( "end", function( ) {
				if ( isJSON( body ) ) {
					promise.resolve( that.normalize( JSON.parse( body ) ) );
				} else {
					promise.reject( "Reponse is no valid JSON" );
				}
			});
		}
	);
	return promise.promise;
};


exports.fetchSearchResults = function( where, from, to, options ) {
	if ( process.env.DEVELOPMENT ) {
		console.log( "Fetching search", where, from, to, options );
	}
	var promise = Q.defer();
	if ( options === undefined ) {
		options = {};
	}
	options.room = options.room || 2;
	options.category = options.category || 1;
	options.resultsDesired = options.resultsDesired || 20;

	http.get( "http://" + host + hotelPath + "/list?" +
				"destinationId=" + encodeURIComponent( where ) +
				"&cid=55505" +
				"&minorRev=20" +
				"&arrivalDate=" + from +
				"&departureDate=" + to +
				"&room1=" + options.room +	// 1 double bed room
				//"&minStarRating=3.0" +	// only better than 
				"&propertyCategory=" + options.category	+ // list only hotels
				"&sort=QUALITY" +			// sort by rating
				"&numberOfResults=" + options.resultsDesired +
				"&apiKey=" + process.env.EAN_KEY,

		function( expediaResponse ) {
			var body = "";
			expediaResponse.on( "error", function( err ) {
				promise.reject( err );
			});
			expediaResponse.on( "data", function(chunk) {
				body += chunk;
			});
			expediaResponse.on( "end", function( ) {
				if ( isJSON( body ) ) {
					promise.resolve( JSON.parse( body ) );
				} else {
					promise.reject( "Response is no valid JSON" );
				}
			});
		}
	);

	return promise.promise;
};