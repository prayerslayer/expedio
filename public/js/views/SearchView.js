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
				where = this.ui.place.val();
			console.log( from, to, where );
			$.ajax({ 
				"url": "http://localhost:3000/search?where=" + where + "&from=" + from + "&to=" + to,
				"dataType": "json",
				"accept": "application/json"
			}).always( function( a, b, c ) {
				console.debug( a, b, c );
			});
		},

		onShow: function() {
			var date_opts = {
				"format": 'dddd, dd mmm, yyyy',
    			"formatSubmit": 'mm/dd/yyyy',
			};
			this.ui.from.pickadate( date_opts );
			this.ui.to.pickadate( date_opts );
		}
	});
})( jQuery );