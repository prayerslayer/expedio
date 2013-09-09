var expedio = expedio || {};

( function( $ ) {
	expedio.HotelView = Backbone.Marionette.ItemView.extend({
		template: "#hotelTemplate",
		id: function() {
			this.model.get( "hotelId" );
		},
		tagName: "div",
		className: "expedio-hotel",

		events: {
			"click": "_select"
		},

		_select: function() {
			this.trigger( "select" );
		}
	});
})( jQuery );