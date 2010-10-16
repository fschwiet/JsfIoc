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
 * RungeKuttaIntegrator
 * 
 * @author Kyle Scholz
 * @author Lorien Henry-Wilkins
 * 
 * @version 0.3
 * 
 * A JavaScript implementation of the Runge-Kutta integrator. This implementation
 * is optimized to reduce the number of symbol lookups.
 * 
 * @see Inspired by traer.physics: http://www.cs.princeton.edu/~traer/physics/
 * @see Algorithm: http://calculuslab.deltacollege.edu/ODE/7-C-3/7-C-3-h.html
 * 
 * @param {ParticleModel} particleModel
 */
var RungeKuttaIntegrator = function( particleModel, view ) {
	this.initialize( particleModel, view );
};
RungeKuttaIntegrator.prototype = {

	/*
	 * @param {ParticleModel} particleModel
	 * @param {View} view
	 */
	initialize: function( particleModel, view ) {
		this.particleModel = particleModel;
		this.particles = particleModel.particles;

		this.view = view;
	
		this.setSize( view.frameWidth, view.frameHeight, view.skew );
	
		this.k1ForcesX = new Array();
		this.k2ForcesX = new Array();
		this.k3ForcesX = new Array();
		this.k4ForcesX = new Array();
	
		this.k1ForcesY = new Array();
		this.k2ForcesY = new Array();
		this.k3ForcesY = new Array();
		this.k4ForcesY = new Array();
	
		this.k1VelocitiesX = new Array();
		this.k2VelocitiesX = new Array();
		this.k3VelocitiesX = new Array();
		this.k4VelocitiesX = new Array();
	
		this.k1VelocitiesY = new Array();
		this.k2VelocitiesY = new Array();
		this.k3VelocitiesY = new Array();
		this.k4VelocitiesY = new Array();		
	},

	/*
	 * Set boundaries.
	 * 
	 * @param {Object} frameWidth
	 * @param {Object} frameHeight
	 */
	setSize: function( frameWidth, frameHeight, skew ) {
		this.boundsLeft = (-frameWidth/2)/skew;
		this.boundsRight = (frameWidth/2)/skew;
		this.boundsTop = -frameHeight/2;
		this.boundsBottom = frameHeight/2;
	},

	/*
	 * Set up storage for a new particle.
	 * 
	 * @param {Number} i
	 */	
	allocateParticle: function( i ) {
		this.k1ForcesX[i] = 0;
		this.k2ForcesX[i] = 0;
		this.k3ForcesX[i] = 0;
		this.k4ForcesX[i] = 0;

		this.k1ForcesY[i] = 0;
		this.k2ForcesY[i] = 0;
		this.k3ForcesY[i] = 0;
		this.k4ForcesY[i] = 0;

		this.k1VelocitiesX[i] = 0;
		this.k2VelocitiesX[i] = 0;
		this.k3VelocitiesX[i] = 0;
		this.k4VelocitiesX[i] = 0;

		this.k1VelocitiesY[i] = 0;
		this.k2VelocitiesY[i] = 0;
		this.k3VelocitiesY[i] = 0;
		this.k4VelocitiesY[i] = 0;
	},

	/*
	 * Perform integration over x=1.
	 */	
	step: function() {
		var particles = this.particles;
		
		var k1ForcesX = this.k1ForcesX;
		var k2ForcesX = this.k2ForcesX;
		var k3ForcesX = this.k3ForcesX;
		var k4ForcesX = this.k4ForcesX;

		var k1ForcesY = this.k1ForcesY;
		var k2ForcesY = this.k2ForcesY;
		var k3ForcesY = this.k3ForcesY;
		var k4ForcesY = this.k4ForcesY;

		var k1VelocitiesX = this.k1VelocitiesX;
		var k2VelocitiesX = this.k2VelocitiesX;
		var k3VelocitiesX = this.k3VelocitiesX;
		var k4VelocitiesX = this.k4VelocitiesX;

		var k1VelocitiesY = this.k1VelocitiesY;
		var k2VelocitiesY = this.k2VelocitiesY;
		var k3VelocitiesY = this.k3VelocitiesY;
		var k4VelocitiesY = this.k4VelocitiesY;

		for (var i=0, l=particles.length; i<l; i++) {
			if (!particles[i].fixed && !particles[i].selected) {
				particles[i].originalPositionX = particles[i].positionX;
				particles[i].originalPositionY = particles[i].positionY;

				particles[i].originalVelocityX = particles[i].velocityX/2;
				particles[i].originalVelocityY = particles[i].velocityY/2;
			}
		}

		this.particleModel.applyForces();
		
		for (var i=0, l=particles.length; i<l; i++) {
			if (!particles[i].fixed && !particles[i].selected) {
				k1ForcesX[i] = particles[i].forceX;
				k1ForcesY[i] = particles[i].forceY;

				k1VelocitiesX[i] = particles[i].velocityX;
				k1VelocitiesY[i] = particles[i].velocityY;
			}
		}

		for (var i=0, l=particles.length; i<l; i++) {
			if (!particles[i].fixed && !particles[i].selected) {
				particles[i].positionX = particles[i].originalPositionX + k1VelocitiesX[i] * 0.5;
				particles[i].positionY = particles[i].originalPositionY + k1VelocitiesY[i] * 0.5;

				particles[i].velocityX = particles[i].originalVelocityX + (k1ForcesX[i] * 0.5)/particles[i].mass;
				particles[i].velocityY = particles[i].originalVelocityY + (k1ForcesY[i] * 0.5)/particles[i].mass;
			}
		}

		this.particleModel.applyForces();
		
		for (var i=0, l=particles.length; i<l; i++) {
			if (!particles[i].fixed && !particles[i].selected) {
				k2ForcesX[i] = particles[i].forceX;
				k2ForcesY[i] = particles[i].forceY;

				k2VelocitiesX[i] = particles[i].velocityX;
				k2VelocitiesY[i] = particles[i].velocityY;
			}
		}

		for (var i=0, l=particles.length; i<l; i++) {
			if (!particles[i].fixed && !particles[i].selected) {
				particles[i].positionX = particles[i].originalPositionX + k2VelocitiesX[i] * 0.5;
				particles[i].positionY = particles[i].originalPositionY + k2VelocitiesY[i] * 0.5;

				particles[i].velocityX = particles[i].originalVelocityX + (k2ForcesX[i] * 0.5)/particles[i].mass;
				particles[i].velocityY = particles[i].originalVelocityY + (k2ForcesY[i] * 0.5)/particles[i].mass;
			}
		}

		this.particleModel.applyForces();

		for (var i=0, l=particles.length; i<l; i++) {
			if (!particles[i].fixed && !particles[i].selected) {
				k3ForcesX[i] = particles[i].forceX;
				k3ForcesY[i] = particles[i].forceY;

				k3VelocitiesX[i] = particles[i].velocityX;
				k3VelocitiesY[i] = particles[i].velocityY;
			}
		}

		for (var i=0, l=particles.length; i<l; i++) {
			if (!particles[i].fixed && !particles[i].selected) {
				particles[i].positionX = particles[i].originalPositionX + k3VelocitiesX[i];
				particles[i].positionY = particles[i].originalPositionY + k3VelocitiesY[i];

				particles[i].velocityX = particles[i].originalVelocityX + (k3ForcesX[i])/particles[i].mass;
				particles[i].velocityY = particles[i].originalVelocityY + (k3ForcesY[i])/particles[i].mass;
			}
		}

		this.particleModel.applyForces();

		for (var i=0, l=particles.length; i<l; i++) {
			if (!particles[i].fixed && !particles[i].selected) {
				k4ForcesX[i] = particles[i].forceX;
				k4ForcesY[i] = particles[i].forceY;

				k4VelocitiesX[i] = particles[i].velocityX;
				k4VelocitiesY[i] = particles[i].velocityY;
			}
		}

		for (var i=0, l=particles.length; i<l; i++) {
			if (!particles[i].fixed && !particles[i].selected) {

				particles[i].positionX = particles[i].originalPositionX
					+ (1 / 6)
					* (k1VelocitiesX[i] + 2 * k2VelocitiesX[i] + 2
					* k3VelocitiesX[i] + k4VelocitiesX[i]);
				particles[i].positionY = particles[i].originalPositionY
					+ (1 / 6)
					* (k1VelocitiesY[i] + 2 * k2VelocitiesY[i] + 2
					* k3VelocitiesY[i] + k4VelocitiesY[i]);
/*
				if ( particles[i].positionX < this.boundsLeft+(this.view.nodes[particles[i].id].centerX) ) {
					particles[i].positionX = this.boundsLeft+(this.view.nodes[particles[i].id].centerX);
				} else if ( particles[i].positionX > (this.boundsRight-(particles[i].width/2)) ) {
					particles[i].positionX = this.boundsRight-(particles[i].width/2);
				}

				if ( particles[i].positionY < this.boundsTop+(this.view.nodes[particles[i].id].centerY) ) {
					particles[i].positionY = this.boundsTop+(this.view.nodes[particles[i].id].centerY);
				} else if ( particles[i].positionY > (this.boundsBottom-(this.view.nodes[particles[i].id].centerY)) ) {
					particles[i].positionY = this.boundsBottom-(this.view.nodes[particles[i].id].centerY);
				}
*/
				particles[i].velocityX = particles[i].originalVelocityX
					+ (1 / (6 * particles[i].mass))
					* (k1ForcesX[i] + 2 * k2ForcesX[i] + 2 * k3ForcesX[i] + k4ForcesX[i]);
				particles[i].velocityY = particles[i].originalVelocityY
					+ (1 / (6 * particles[i].mass))
					* (k1ForcesY[i] + 2 * k2ForcesY[i] + 2 * k3ForcesY[i] + k4ForcesY[i]);
			}
		}
	}
}