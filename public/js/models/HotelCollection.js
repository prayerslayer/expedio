var expedio = expedio || {};

( function( $ ) {
	expedio.HotelCollection = Backbone.Collection.extend({

        model: expedio.Hotel,

        comparator: function( m ) {
            return m.get( "score" );
        },

        parse: function( data ) {
            console.debug( data );
            var list = data.HotelListResponse.HotelList.HotelSummary;
            _.each( list, function( hotel ) {
                hotel.id = hotel.hotelId;
                hotel.score = hotel.lowRate / ( hotel.tripAdvisorRating || hotel.hotelRating );
            });
            console.debug( list );
            return list;
        }

	});
})( jQuery );