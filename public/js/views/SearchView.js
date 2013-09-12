var expedio = expedio || {};

( function( $ ) {
	expedio.SearchView = Backbone.Marionette.ItemView.extend({
		template: "#searchTemplate",
		tagName: "div",
		className: "expedio-search",

		ui: {
			"from": "input.date-from",
			"to": "input.date-to",
			"place": "input.place"
		},

		events: {
			"click .button-search": "_search"
		},

		_search: function( ) {
			var from = this.$el.find( "input[name=date-from_submit]" ).val(),
				to = this.$el.find( "input[name=date-to_submit]" ).val(),
				where = this.currentDestinationId;
				
			this.trigger( "search", where, from, to );
		},

		onShow: function() {
			var date_opts = {
					"format": 'dddd, dd mmm, yyyy',
	    			"formatSubmit": 'mm/dd/yyyy',
				},
				that = this;
			this.ui.from.pickadate( date_opts );
			this.ui.to.pickadate( date_opts );
			this.ui.place.autocomplete({
				source: function( request, response ) {
					$.ajax({ 
						"url": "http://localhost:3000/disambiguate/" + request.term
					}).done( function( data ) {
						// parse json string if necessary
						if ( typeof data === "string" )
							data = JSON.parse( data );
						// go to results
						var locs = data.LocationInfoResponse.LocationInfos.LocationInfo;
						// if there is only one result, EAN returns an object
						if ( !_.isArray( locs ) )
							locs = [ locs ];
						// get data showable to user
						var show = _.map( locs, function( loc ) {
							var label = loc.city + ( loc.stateProvinceCode ? ", " + loc.stateProvinceCode : "" ) + ", " + loc.countryName;
							return { "label": label, "value": loc.destinationId };
						});
						console.debug( show );
						response( show );
					});
				},
				delay: 300,
				minLength: 3
			});
			this.ui.place.on( "autocompleteselect", function( ev, ui ) {
				// prevent jquery from putting the value (locationId) in the textbox!
				ev.preventDefault();
				// put label there
				$( this ).val( ui.item.label );
				// set id
				that.currentDestinationId = ui.item.value;
			});
		}
	});
})( jQuery );