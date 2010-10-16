/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 *     
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Author: Kyle Scholz      http://kylescholz.com/
 * Copyright: 2006-2007
 */

/**
 * HTTP
 * 
 * @author Kyle Scholz
 * 
 * @version 0.3
 * 
 * Encapsulate some HTTP functionality
 */
var HTTP = function() {
	this.init();
}
HTTP.prototype = {

	init: function() {
		
	},

	/*
	 * Get a platform tailored XMLHttpRequest
	 */
	getRequestObject: function() {

		var req;

		// Native: Most browsers
		if (window.XMLHttpRequest) {
			try {
				req = new XMLHttpRequest();
			} catch(e) {
				req = false;
			}

		// ActiveX: IE/Windows
		} else if(window.ActiveXObject) {
			try {
				req = new ActiveXObject("Msxml2.XMLHTTP");
			} catch(e) {
				try {
					req = new ActiveXObject("Microsoft.XMLHTTP");
				} catch(e) {
					req = false;
				}
			}
		}
		return req;
	},

	/*
	 * Fire a GET request.
	 * 
	 * Any additional paramters will be delivered to handler.
	 * 
	 * @param {String} url
	 * @param {Object} _caller
	 * @param {Function} _handler
	 */
	get: function( url, _caller, _handler ) {
		var request = this.getRequestObject();
		var args=new Array();
		args.push( request );
		for( var i=3; i<arguments.length; i++ ) {
			args.push( arguments[i] );
		}
		try {
			request.open("GET", url, true);
			request.onreadystatechange = function() {
				if (request.readyState == 4) {
					_handler.apply( _caller, args );
				}
				// todo: handle errors
			}
			request.send(null);
			delete request;
		} catch( e ) {
			alert("(Mozilla) - " + e);
		}
	}
}

/*
 * Browsers use different attributes to refer to XML node values
 * 
 * @param {Object} xml
 * 
 * @todo find a home for this function
 */
function getTextFromNode( xml ) {
	if (xml) {
		// Mozilla
		if (xml.textContent) return xml.textContent;
		// IE
		if (xml.innerText) return xml.innerText;
		// ??
		if (xml.text) return xml.text;
	}
}