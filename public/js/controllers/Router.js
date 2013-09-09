var expedio = expedio || {};

( function( $ ) {
	expedio.Router = Backbone.Router.extend({
		routes: {
			"": "index",
			"search/in/:place/from/:from/to/:to/": "search"
		},

		index: function() {
		},

		search: function( place, from, to ) {

		}
	});
})( jQuery );