var expedio = expedio || {};

( function( $ ) {
	expedio.App = Backbone.Marionette.Application.extend({

		start: function( opts ) {
			var that= this;
			this.addRegions({
                "main": "div#main"
            });
            var search = new expedio.SearchView();
            this.getRegion( "main" ).show( search );	
            search.on( "search", function( where, from, to ) {
            	search.close();

            	var coll = new expedio.HotelCollection( [], {
            		url: "http://localhost:3000/search?where=" + where + "&from=" + from + "&to=" + to
            	});
            	coll.fetch({
            		"success": function() {
            			var list = new expedio.HotelListView({
            				collection: coll
            			});
            			that.getRegion( "main" ).show( list );
            		}
            	});
            });
		}
		
	});
})( jQuery );