var expedio = expedio || {};

( function( $ ) {
	expedio.HotelCollection = Backbone.Collection.extend({

        model: expedio.Hotel,

        comparator: function( m ) {
            return m.get( "tripAdvisorRating" );
        },

        parse: function( data ) {
            //this.more_available = data.HotelListResponse.moreResultsAvailable;
            _.each( data, function( hotel ) {
                hotel.id = hotel.hotelId;
                if ( !hotel.tripAdvisorRating )
                    hotel.tripAdvisorRating = 0;
            });
            return data;
        }

	});
})( jQuery );