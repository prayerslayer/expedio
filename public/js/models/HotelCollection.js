var expedio = expedio || {};

( function( $ ) {
	expedio.HotelCollection = Backbone.Collection.extend({

        model: expedio.Hotel,

        comparator: function( m ) {
            return m.get( "score" );
        },

        parse: function( data ) {
            var list = data.HotelListResponse.HotelList.HotelSummary;
            _.each( list, function( hotel ) {
                hotel.score = hotel.lowRate / hotel.tripAdvisorRating;
            });
            return list;
        }

	});
})( jQuery );