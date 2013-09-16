/*
 *	Spinner
 *	=======
 *
 *	A simple spinner. Create it and tell it where to render, close when appropriate.
 *
 *	@author npiccolotto
*/
var expedio = expedio || {};

( function( $ ) {
	expedio.Spinner = Backbone.Marionette.ItemView.extend({
		tagName: "div",
		className: "expedio-spinner",
		template: "#spinnerTemplate",

		onRender: function() {
			$( "body" ).append( this.$el );
			this.$el.position({
				"of": $( "body" ),
				"my": "center center",
				"at": "center center"
			});
		}
	});
})( jQuery );