var expedio = expedio || {};

( function( $, Backbone ) {
	expedio.HotelView = Backbone.Marionette.ItemView.extend({
		template: "#hotelTemplate",
		id: function() {
			return "hotel-" + this.model.get( "hotelId" );
		},
		tagName: "div",
		className: "expedio-hotel",

		events: {
			"click": "_select"
		},

		highlight: function() {
			this.$el.addClass( "expedio-hotel_highlight" );
		},

		unhighlight: function() {
			this.$el.removeClass( "expedio-hotel_highlight" );
		},

		_select: function() {
			this.trigger( "select" );
			this.highlight();
		}
	});
})( jQuery, Backbone );