var expedio = expedio || {};

( function( $ ) {
	expedio.HotelCollection = Backbone.Collection.extend({

        model: expedio.Hotel,
        more_available: false,

        comparator: function( m ) {
            return m.get( "score" );
        },

        parse: function( data ) {
            this.more_available = data.HotelListResponse.moreResultsAvailable;
            var list = data.HotelListResponse.HotelList.HotelSummary;
            _.each( list, function( hotel ) {
                hotel.id = hotel.hotelId;
                hotel.score = hotel.lowRate / ( hotel.tripAdvisorRating || hotel.hotelRating );
                if ( !hotel.tripAdvisorRating )
                    hotel.tripAdvisorRating = 0;
            });
            console.debug( list );
            return list;
        }

	});
})( jQuery );