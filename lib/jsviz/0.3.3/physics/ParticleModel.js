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
 * Author: Lorien Henry-Wilkins
 * Copyright: 2006-2007
 */

/**
 * ParticleModel
 * 
 * @author Kyle Scholz
 * @author Lorien Henry-Wilkins
 * 
 * @version 0.3
 * 
 * The ParticleModel drives our graph. It applies the forces that dictate the
 * position of nodes.
 * 
 * This implementation is optimized to:
 * - Draw nodes only when visible changes have occured.
 * - Recompute forces on older particles at lower frequency
 *   - Can be further optimized to adjust frequency based on a force's volatility
 *     or the volatility in it's constituent particles' positions.
 */
var ParticleModel = function( view ){
	this.init( view );
}
ParticleModel.prototype = {

	/*
	 * Initialize the ParticleModel
	 */
	init: function( view ) {
		this.ENTROPY_THROTTLE=true;

		this.view = view;

		this.particles = new Array();

		this.nextParticleId = 0;

		this.springs = new Array();

		this.activeSprings = new Array();

		this.springLast = 0;

		this.magnets = new Array();

		this.activeMagnets = new Array();

		this.magLast = 0;

		this.integrator = new RungeKuttaIntegrator( this, view );

		this.timer = new Timer( 1 );
		
		this.timer.subscribe( this );	

		this.setSize(this.view.frameWidth,this.view.frameHeight,this.view.skewX,this.view.skewY);
	},
	
	/*
	 * Perform a timestep.
	 */
	tick: function() {
		this.integrator.step(1);
		return this.draw();
	},

	/*
	 * Set boundaries.
	 * 
	 * @param {Object} frameWidth
	 * @param {Object} frameHeight
	 */
	setSize: function( frameWidth, frameHeight ) {
		this.boundsLeft = (-frameWidth/this.view.skewX)/2;
		this.boundsRight = (frameWidth/this.view.skewX)/2;
		this.boundsTop = (-frameHeight/this.view.skewY)/2;
		this.boundsBottom = (frameHeight/this.view.skewY)/2;
	},

	/*
	 * Draw all particles
	 */
	draw: function( force ) {
		var view = this.view;
		var particles = this.particles;
		var moved = 0;
		
		var skewX = this.view.skewX;
		var skewY = this.view.skewY;		
		for ( var i=0, l=particles.length; i<l; i++ ) {
			var particle = particles[i];

			//bounds checking		
			if( this.boundsLeft ) { //only check if the bounds have been set
				if ( particle.positionX < this.boundsLeft+(particle.width/2)/skewX ) {
					particle.positionX = this.boundsLeft+(particle.width/2)/skewX;
				} else if ( particle.positionX > (this.boundsRight-(particle.width/2)/skewX) ) {
					particle.positionX = this.boundsRight-(particle.width/2)/skewX;
				}
	
				if ( particle.positionY < this.boundsTop+(particle.height/2/skewY) ) {
					particle.positionY = this.boundsTop+(particle.height/2/skewY);
				} else if ( particle.positionY > (this.boundsBottom-(particle.height/2/skewY)) ) {
					particle.positionY = this.boundsBottom-(particle.height/2/skewY);
				}
			}

			var newDrawPositionX = Math.round(particle.positionX*2)/2;
			var newDrawPositionY = Math.round(particle.positionY*2)/2;
			// only redraw if particle position has changed by 2px
			if ( newDrawPositionX != particle.lastDrawPositionX || newDrawPositionY != particle.lastDrawPositionY || force ) {
				view.drawNode( particle );					
				moved++;
			}
			particle.lastDrawPositionX = newDrawPositionX;
			particle.lastDrawPositionY = newDrawPositionY;
		}
		return moved;
	},
	
	/*
	 * Create and add a new particle to the system.
	 *  
	 * @param {Number} mass
	 * @param {Number} x
	 * @param {Number} y
	 */
	makeParticle: function( mass, x, y ) {
		var particle = new Particle( mass, x, y );
		particle.id = this.nextParticleId++;
		this.particles.push( particle );
		this['integrator'].allocateParticle( particle.id );

		if ( this.timer.interupt ) {
			this.timer.start();
		}

		return particle;
	},

	/*
	 * Create a Spring between 2 nodes
	 * 
	 * @param {Particle} a  - A Particle.
	 * @param {Particle} b  - The other Partilce.
	 * @param {Number} springConstant - The Spring constant.
	 * @param {Number} dampingConstant  - The damping constant.
	 * @param {Number} restLength  - The length of the Spring at rest.
	 */	
	makeSpring: function( a,  b, springConstant, dampingConstant, restLength ) {
		var spring = new Spring(a, b, springConstant, dampingConstant, restLength);
		this.springs.push( spring );
		this.activeSprings.push( spring );
		return( spring );
	},
	
	/*
	 * Create a magnetic force between nodes
	 * 
	 * @param {Particle} a  - A Particle.
	 * @param {Particle} b  - The other Particle.
	 * @param {Number} g - A gravitational constant (that's right)
	 * @param {Number} distanceMin
	 */
	makeMagnet: function( a, b, g, distanceMin ) {
		var magnet = new Magnet( a, b, g, distanceMin );
		this.magnets.push( magnet );
		this.activeMagnets.push( magnet );
		if ( this.activeMagnets.length > 50 ) {
			this.activeMagnets.shift();
		}
		return magnet;		
	},

	/*
	 * Calculate and aggregate all forces for each particle
	 */
	applyForces: function() {

		/* Spring Forces */

		var activeSprings = this.activeSprings;
		var springs = this.springs;
		var springLast = this.springLast;

		var scanLength=parseInt(springs.length/10);

		// Active Springs
		for( var i=0, l=activeSprings.length; i<l; i++ ) {
			activeSprings[i].apply();
			activeSprings[i].age++;
		}

// todo: I'm only pulling one node from the active collection per iteration		
		var springLen = this.activeSprings.length;
		if ( springLen > 0 && this.activeSprings[0].age > 20 ) {
			this.activeSprings.shift();
		}

		// Calculate forces from Springs in window
		for( var i=springLast, t=springLast+scanLength, l=springs.length; i<t && i<l; i++ ) {
			springs[i].apply();
		}

		// Shift Window
		this['springLast']+=scanLength;
		if ( this['springLast'] >= springs.length ) {
			this['springLast'] = 0;
		}

		/* Magnetic Forces */

		var activeMagnets = this.activeMagnets;
		var magnets = this.magnets;
		var magLast = this['magLast']

		scanLength=parseInt(magnets.length/10);

		// Active Magnets
		for( var i=0, l=activeMagnets.length; i<l; i++ ) {
			activeMagnets[i].apply();
			activeMagnets[i].age++;
		}

// todo: I'm only pulling one node from the active collection per iteration
		var magLen = this.activeMagnets.length;
		if ( magLen > 0 && this.activeMagnets[0].age > 50 ) {
			this.activeMagnets.shift();
		}

		// Calculate forces from Magnets in window
		for( var i=magLast, t=magLast+scanLength, l=magnets.length; i<t && i<l; i++ ) {
			magnets[i].apply();
		}

		// Shift Window
		this['magLast']+=scanLength;
		if ( this['magLast'] >= magnets.length ) {
			this['magLast'] = 0;
		}
	},

	/*
	 * Reset all of the stored forces in the model. 
	 */	
	reset: function() {

		var springs = this.springs;
		for( var i=0, l=springs.length; i<l; i++ ) {
			springs[i].forceX = 0;
			springs[i].forceY = 0;
		}

		var magnets = this.magnets;
		for( var i=0, l=magnets.length; i<l; i++ ) {
			magnets[i].forceX = 0;
			magnets[i].forceY = 0;
		}

		var particles = this.particles;
		for( var i=0, l=particles.length; i<l; i++ ) {
			particles[i].forceX = 0;
			particles[i].forceY = 0;
		}

		var particles = this.particles;
		for( var i=0, l=particles.length; i<l; i++ ) {
			this.integrator.allocateParticle(i);
		}

		if ( this.timer.interupt ) {
			this.timer.start();
		}
	},

	/*
	 * Call animation timer update. Instruct the timer slow down if the
	 * graph is settling.
	 */
	update: function() {
		var moved = this.tick();
		var result = 1;
		if ( this.ENTROPY_THROTTLE && this.particles.length > 2 ) {
			var e = (moved/(this.particles.length));
			if ( e < .01 ) {
				this.stop();
			} else if ( e < .05 ) {
				return(1000);
			} else if ( e < .1 ) {
			return(200);
			}
			return(1);
		}
		return result;
	},
	
	/*
	 * Start animation timer.
	 */
	start: function() {
		this.timer.start();
	},

	/*
	 * Stop animation timer.
	 */	
	stop: function() {
		this.timer.stop();
	},

	/*
	 * Clear particles and forces. Wipe out intermediate data from view and integrator. 
	 */	
	clear: function() {
		this.particles = new Array();

		this.nextParticleId = 0;

		this.springs = new Array();

		this.activeSprings = new Array();

		this.springLast = 0;

		this.magnets = new Array();

		this.activeMagnets = new Array();

		this.magLast = 0;
		
		this.view.clear();
		
		this.integrator.initialize( this, this.view );
	}
}