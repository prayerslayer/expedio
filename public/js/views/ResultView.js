var expedio = expedio || {};

( function( $ ) {
	expedio.ResultView = Backbone.Marionette.CompositeView.extend({
		template: "#resultTemplate",
		tagName: "div",
		className: "expedio-hotels",
		itemView: expedio.HotelView,
		itemViewContainer: "div.expedio-hotels_list",

		onShow: function() {
			var first = this.collection.at( 0 );
			L.mapbox.map('map', 'prayerslayer.map-h9uyx9eo')
      		.setView([
      			first.get( "latitude" ), 
      			first.get( "longitude" )], 10);
		}
	});
})( jQuery );