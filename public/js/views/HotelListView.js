var expedio = expedio || {};

( function( $ ) {
	expedio.HotelListView = Backbone.Marionette.CollectionView.extend({
		tagName: "div",
		className: "expedio-hotels",
		itemView: expedio.HotelView
	});
})( jQuery );