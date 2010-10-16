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
 * Timer
 * 
 * @author Kyle Scholz
 * 
 * @version 0.3
 * 
 * Timer with very rough throttle.
 * 
 * @author Kyle Scholz
 */
var Timer = function( timeout ) {
	this.init( timeout );
};
Timer.prototype = {

	/*
	 * Initialize the Timer with the indicated timeout.
	 * 
	 * @param {Object} timeout
	 */
	init: function( timeout ) {
		this['timer'];
		this['TIMEOUT'] = timeout;
		this['BASE_TIMEOUT'] = timeout;
		this['interupt'] = true;
		this['subscribers'] = new Array();
		this['ontimeout'] = new EventHandler( this,
			// notify subscribers and restart timer
			function() {
				this.notify();
				if ( !this.interupt ) { this.start(); }
			}
		);
	},

	/*
	 * Start the Timer.
	 */
	start: function() {
		this['interupt']=false;
		this['timer'] = window.setTimeout(this.ontimeout,this['TIMEOUT']);
	},

	/*
	 * Stop the Timer.
	 */
	stop: function() {
		this['interupt']=true;
	},

	/*
	 * Subscribe an observer.
	 */
	subscribe: function( observer ) {
		this.subscribers.push( observer );
	},

	/*
	 * Notify observers when a tick event has occured.
	 */
	notify: function() {
		for( var i=0; i<this.subscribers.length; i++ ) {
			var nextTimeout = this.subscribers[i].update();
			if ( nextTimeout == false ) {
				this.stop();
			} else if ( nextTimeout != null ) {
				this['TIMEOUT']=nextTimeout;
			}
		}
	}
}