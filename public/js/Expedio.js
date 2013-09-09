var expedio = expedio || {};

( function( $ ) {
	expedio.App = Backbone.Marionette.Application.extend({

		start: function( opts ) {
			var that = this;
			this.addRegions({
                "main": "div#main"
            });

			// create router
            this.router = new expedio.Router();
            this.router.on( "route:index", this._handleIndex, this );
            this.router.on( "route:search", this._handleSearch, this );
            Backbone.history.start();
		},

		_handleIndex: function() {
			// create search view
			var that = this;
            var search = new expedio.SearchView();
            this.getRegion( "main" ).show( search );

            // if a search was placed, show result view
            search.on( "search", function( where, from, to ) {
            	search.close();
            	this.router.navigate( "search/in/" + encodeURIComponent( where ) + "/from/" + from + "/to/" + to + "/" );
            });
		},

		_handleSearch: function( place, from, to ) {
			from = moment( from, "DD-MM-YYYY" ).format( "MM/DD/YYYY");
			to = moment( to, "DD-MM-YYYY" ).format( "MM/DD/YYYY");
			this._search( place, from, to );
		},

		_search: function( where, from, to ) {
			var that = this;
			var coll = new expedio.HotelCollection( [], {
        		url: "http://localhost:3000/search?where=" + encodeURIComponent( where ) + "&from=" + from + "&to=" + to
        	});
        	coll.fetch().done( function() {
        		var results = new expedio.ResultView({
    				collection: coll
    			});
    			that.getRegion( "main" ).show( results );
        	});
		}
		
	});
})( jQuery );