var expedio = expedio || {};

( function( $ ) {
	expedio.HotelView = Backbone.Marionette.ItemView.extend({
		template: "#hotelTemplate",
		tagName: "div",
		className: "expedio-hotel"
	});
})( jQuery );