var expedio = expedio || {};

( function( $ ) {
	expedio.ResultView = Backbone.Marionette.CompositeView.extend({
		template: "#resultTemplate",
		tagName: "div",
		className: "expedio-hotels",
		itemView: expedio.HotelView,
		itemViewContainer: "div.expedio-hotels_list",

		big_map: false,

		ui: {
			"map": "div#map",
			"handle": "div#pullHandle",
			"container": "div.expedio-hotels_list"
		},

		events: {
			"click div#pullHandle": "_pullMap"
		},

		onRender: function() {
			this.on( "itemview:select", this._panToHotel, this );
			this.on( "itemview:select", this._highlightHotel, this );
		},

		_pullMap: function() {
			if ( !this.big_map ) {
				this.ui.map.css( "flex", "6" );
				this.ui.handle.text( "-" );
			} else {
				this.ui.map.css( "flex", "1" );
				this.ui.handle.text( "+" );
			}
			this.big_map = !this.big_map;
		},

		_panToHotel: function( view ) {
			if ( typeof view === "number" ) {
				var hotel = this.collection.get( view );
				view = this.children.findByModel( hotel );
			} 
			var lat = view.model.get( "latitude" );
				lon = view.model.get( "longitude" );
			
			this.map.panTo( [ lat, lon ] );
		},

		_scrollToHotel: function( hotelId ) {
			var hotel = this.collection.get( hotelId ),
				view = this.children.findByModel( hotel );
			this.ui.container.scrollTop( view.el.offsetTop - view.$el.height() );
			view.highlight();
		},

		_highlightHotel: function( hotelId ) {
			if ( typeof hotelId === "object" ) {
				hotelId = hotelId.model.get( "hotelId" ); // hotelId is actually a view
			}

			var geo = this.map.markerLayer.getGeoJSON();
			_.each( geo, function( p ) {
				if ( p.properties.hotelId === hotelId ) {
					p.properties[ "marker-color" ] = "#f00";
				} else {
					p.properties[ "marker-color" ] = "#0089EC";
				}
			});
			var that = this;
			that.map.markerLayer.setGeoJSON( geo );
		},

		onShow: function() {
			var first = this.collection.at( 0 ),
				that = this;

			this.map = L.mapbox.map('map', 'prayerslayer.map-h9uyx9eo')
			      		.setView([
			      			first.get( "latitude" ), 
			      			first.get( "longitude" )], 13);

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
							"description": m.get( "shortDescription" ),
							"hotelId": m.get( "hotelId" ),
							"marker-size": "small",
							"marker-symbol": "building",
							"marker-color": "#0089EC",
						}
				};
				geoJSON.push( point );
			});
			this.map.markerLayer.setGeoJSON( geoJSON );
			this.map.markerLayer.on( "click", function( e ) {
				var id = e.layer.feature.properties.hotelId;
				that._panToHotel( id );
				that._scrollToHotel( id );
				that._highlightHotel( id );
			});
		}
	});
})( jQuery );