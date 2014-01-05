/*
 * Gruntfile.js
 * @version 1.0.0
 */

"use strict";

module.exports = function (grunt) {

	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-watch" );

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		project: {
			"name": "expedio"
		},
		
		jshint: {
			options: {
				jshintrc: ".jshintrc"
			},
			files: [ "public/js/*.js", "public/js/controllers/*.js", "public/js/models/*.js", "public/js/views/*.js", "tests/*.js", "*.js" ]
		},
		watch: {
			jshint: {
				files: [ "public/js/*.js", "public/js/controllers/*.js", "public/js/models/*.js", "public/js/views/*.js", "tests/*.js", "*.js" ],
				tasks: [
					"jshint"
				]
			}
		}
	});

	grunt.registerTask("default" , "watch");

};