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
 * Particle
 * 
 * @author Kyle Scholz
 * 
 * @version 0.3
 * 
 * A Particle in our model.
 * 
 * @param {Number} mass
 * @param {Number} positionX
 * @param {Number} positionY
 */
var Particle = function( mass, positionX, positionY ){
	this.init( mass, positionX, positionY );
}
Particle.prototype = {
	
	/*
	 * Initialize
	 * 
	 * @param {Object} mass
	 * @param {Object} position
	 */
	init: function( mass, positionX, positionY ) {

		this['positionX'] = positionX;
		this['positionY'] = positionY;

		this['originalPositionX'] = positionX;
		this['originalPositionY'] = positionY;

		this['lastDrawPositionX'] = 0;
		this['lastDrawPositionY'] = 0;

		this['mass'] = mass;
	
		this['forceX'] = 0;
		this['forceY'] = 0;

		this['velocityX'] = 0;
		this['velocityY'] = 0;

		this['originalVelocityX'] = 0;
		this['originalVelocityY'] = 0;

		this['fixed'] = false;

		this['selected'] = false;
		
		this['age'] = 0;
		
		// we use width and height for bounds checking	
		this['width'] = 0;	

		this['height'] = 0;	
	}
}