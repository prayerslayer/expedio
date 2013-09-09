var expedio = expedio || {};

( function( $ ) {
	expedio.ResultView = Backbone.Marionette.CompositeView.extend({
		template: "#resultTemplate",
		tagName: "div",
		className: "expedio-hotels",
		itemView: expedio.HotelView,
		itemViewContainer: "div.expedio-hotels_list",

		ui: {
			"container": "div.expedio-hotels_list"
		},

		onRender: function() {
			this.on( "itemview:select", this._panToHotel, this );
		},

		_panToHotel: function( view ) {
			console.log( view.model );
			this.map.panTo( [ view.model.get( "latitude" ), view.model.get( "longitude" ) ] );
		},

		_scrollToHotel: function( hotelId ) {
			var hotel = this.collection.get( hotelId ),
				view = this.children.findByModel( hotel );
			console.log( view.el.offsetTop );
			this.ui.container.scrollTop( view.el.offsetTop - 66 ); //TODO magic number
		},

		onShow: function() {
			var first = this.collection.at( 0 ),
				that = this;
			this.map = L.mapbox.map('map', 'prayerslayer.map-h9uyx9eo')
			      		.setView([
			      			first.get( "latitude" ), 
			      			first.get( "longitude" )], 15);

			// craete points
			var geoJSON = [];
			this.collection.each( function( m ) {
				var point = {
						"type": "Feature",
						"geometry": {
							"type": "Point",
							"coordinates": [ m.get( "longitude" ), m.get( "latitude" ) ]
						},
						"properties": {
							"title": m.get( "name" ),
							"hotelId": m.get( "hotelId" )
						}
				};
				geoJSON.push( point );
			});
			this.map.markerLayer.setGeoJSON( geoJSON );
			this.map.markerLayer.on( "click", function( e ) {
				that._scrollToHotel( e.layer.feature.properties.hotelId );
			});
		}
	});
})( jQuery );