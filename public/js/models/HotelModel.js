var expedio = expedio || {};

( function( ) {
	expedio.Hotel = Backbone.Model.extend({
		currencyFormat: "$ 0,0",
		maxImages: 20,

		initialize: function( data ) {
			// set human readable numbers
			this.set( "hr_lowRate", numeral( data.lowRate ).format( this.currencyFormat ) );
			this.set( "hr_highRate", numeral( data.highRate ).format( this.currencyFormat ) );

			// enforce maximum amount of images 
			this.set( "images", this.get( "images" ).splice( 0, this.maxImages ) );
		}

	});
})( jQuery );