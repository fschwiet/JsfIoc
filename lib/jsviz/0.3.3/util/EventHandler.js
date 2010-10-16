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
 * EventHandler
 * 
 * @author Kyle Scholz
 * 
 * @version 0.3
 * 
 * A factory for producing event handlers w/ contextual scope.
 * 
 * @param {Object} _caller: an object with scope needed by handler
 * @param {Object} _handler: an event handler function
 * 
 * Any additional arguments will be passed to _handler. The source event will be
 * the last argument in the list if it's available.
 */
var EventHandler = function( _caller, _handler ) {
	var args=new Array();
	for( var i=2; i<arguments.length; i++ ) {
		args.push( arguments[i] );
	}
	return( function( e ) {
			if( e ) { args.push(e); }
			_handler.apply( _caller, args );
	} );
};