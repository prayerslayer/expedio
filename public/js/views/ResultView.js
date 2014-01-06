var expedio = expedio || {};

( function( ) {
	expedio.ResultView = Backbone.Marionette.CompositeView.extend({
		template: "#resultTemplate",
		tagName: "div",
		className: "expedio-hotels",
		itemView: expedio.HotelView,
		itemViewContainer: "div.expedio-hotels_list",

		ui: {
			"map": "div#map",
			"container": "div.expedio-hotels_list"
		},

		events: {
			
		},

		onRender: function() {
			this.on( "itemview:select", this._panToHotel, this );
			this.on( "itemview:select", this._highlightHotel, this );
		},

		_panToHotel: function( view ) {
			if ( typeof view === "number" ) {
				var hotel = this.collection.get( view );
				view = this.children.findByModel( hotel );
			}
			var lat = view.model.get( "latitude" ),
				lon = view.model.get( "longitude" );
			
			this.map.panTo( [ lat, lon ] );
		},

		_scrollToHotel: function( hotelId ) {
			var hotel = this.collection.get( hotelId ),
				view = this.children.findByModel( hotel );
			this.ui.container.animate({
				"scrollTop": view.el.offsetTop - 8
			}, {
				"duration": 200,
				"complete": function() {
					view.highlight();
				}
			});
		},

		_highlightHotel: function( hotelId ) {
			if ( typeof hotelId === "object" ) {
				hotelId = hotelId.model.get( "hotelId" ); // hotelId is actually a view
			}
			// unhighlight others
			this.children.call( "unhighlight" );

			var geo = this.map.markerLayer.getGeoJSON();
			_.each( geo, function( p ) {
				if ( p.properties.hotelId === hotelId ) {
					p.properties[ "marker-color" ] = "#B43C42";
				} else {
					p.properties[ "marker-color" ] = "#79A6D2";
				}
			});
			var that = this;
			that.map.markerLayer.setGeoJSON( geo );
		},

		onShow: function() {
			var first = this.collection.at( 0 ),
				that = this;

			this.map = L.mapbox.map( "map", "prayerslayer.map-h9uyx9eo" )
						.setView([ first.get( "latitude" ), first.get( "longitude" )], 13 );

			// hide attribution
			$( ".leaflet-control-attribution" ).hide();

			// craete points
			var geoJSON = [];
			this.collection.each( function( m ) {
				// create geojson
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
						"marker-color": "#79A6D2",
					}
				};
				geoJSON.push( point );

				// group photon images
				(new Photon( "#hotel-" + m.id + " .expedio-hotel_image" )).start();
			});
			this.map.markerLayer.setGeoJSON( geoJSON );
			this.map.markerLayer.on( "click", function( e ) {
				var id = e.layer.feature.properties.hotelId;
				that._scrollToHotel( id );
				that._highlightHotel( id );
			});

			Echo.init({
                offset: 100,
                throttle: 200
            });
		}
	});
})( jQuery );