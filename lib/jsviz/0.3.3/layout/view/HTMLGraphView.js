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
 * HTMLGraphView
 * 
 * @author Kyle Scholz
 * 
 * @version 0.3.3
 * 
 * Represents a view on a GraphModel. This implementation supports HTML elements.
 * 
 * @param {HTMLElement} container
 * @param {Boolean} skewView (optional) Indicates whether we should draw on a 'skewed' canvas.
 */
var HTMLGraphView = function( container, skewView ) {

	this.container = container;

	this.frameLeft = 0;
	this.frameTop = 0;

	this.skewView = skewView;
	this.skewBase = 0;
	this.skewX = 1;
	this.skewY = 1;

	this['nodes'] = {};
	this['edges'] = {};

	this.defaultEdgeProperties = {
		'pixelColor': '#c4c4c4',
		'pixelWidth': '2px',
		'pixelHeight': '2px',
		'pixels': 4
	}
}

/*
 * @param {Number} frameLeft
 * @param {Number} frameTop
 * @param {Number} frameWidth
 * @param {Number} frameHeight
 */
HTMLGraphView.prototype.setSize = function( frameLeft, frameTop, frameWidth, frameHeight ) {
	this.frameLeft = frameLeft;
	this.frameTop = frameTop;
	this.frameWidth = frameWidth;
	this.frameHeight = frameHeight;

	this.centerX = parseInt(frameWidth/2);
	this.centerY = parseInt(frameHeight/2);		

	if ( this.skewView && this.skewBase) {
		this.skewX = this.frameWidth/this.skewBase;
		this.skewY = this.frameHeight/this.skewBase;
	} else {
		this.skewX = 1;
		this.skewY = 1;
	}
}

/*
 * Add a node to the view. 
 *
 * @param {Particle} particle
 * @param {DOMNode} domElement
 * @param {Number} centerOffsetX, Position of center of domNode relative to 
 * 		left. If not provided, SVG elements are assumed centered. The center of
 * 		HTML elements is set to offsetWidth/2.
 * @param {Number} centerOffsetY, Position of center of domNode relative to 
 * 		top. If not provided, SVG elements are assumed centered. The center of
 * 		HTML elements is determined by offsetHeight/2.
 */
HTMLGraphView.prototype.addNode = function( particle, domElement,
	centerOffsetX, centerOffsetY ) {

	this.container.appendChild(domElement);
	domElement.style.zIndex=10;
	if ( centerOffsetX == null ) {
		centerOffsetX = parseInt( domElement.offsetWidth/2 );
	}
	if ( centerOffsetY == null ) {
		centerOffsetY = parseInt( domElement.offsetHeight/2 );
	}

	this.nodes[particle.id] = {
		domElement: domElement,
		centerX: centerOffsetX,
		centerY: centerOffsetY			
	}
	domElement.style.left="0px";
	domElement.style.top="0px";

	this.drawNode(particle);
	return domElement;
}

/*
 * Drop node, eliminating dom element from document
 */
HTMLGraphView.prototype.removeNode = function( particle ) {
	if ( particle ) {
		var domElement = this.nodes[particle.id].domElement;
		this.container.removeChild( domElement );
	
		// delete edges to particle
		for ( var e in this.edges[particle.id] ) {
			this.removeEdge(this.edges[particle.id][e]);
		}
		
		// delete edges to particle
		for ( var e in this.edges ) {
			if ( this.edges[e][particle.id] ) {
				this.removeEdge(this.edges[e][particle.id]);
			}
		}
	
		delete this.nodes[particle.id];
	}
}

/*
 * Add an edge to the view.
 * 
 * @param {Particle} particleA
 * @param {Particle} particleB
 */
HTMLGraphView.prototype.addEdge = function( particleA, particleB, edgeProperties ) {

	if ( !this['edges'][particleA.id] ) {
		this['edges'][particleA.id]={};
	}

	if ( !this['edges'][particleA.id][particleB.id] ) {		
		// create the "pixels" used to draw the edge
		var edgePixels = new Array();

		if ( !edgeProperties ) {
			edgeProperties = this.defaultEdgeProperties;
		}
	
		var pixelCount = edgeProperties.pixels;
		var pixels = [];

		for ( var k=0, l=pixelCount; k<l; k++ ) {
			var pixel = document.createElement('div');
			pixel.style.width = edgeProperties.pixelWidth;
			pixel.style.height = edgeProperties.pixelHeight;
			pixel.style.backgroundColor = edgeProperties.pixelColor;
			pixel.style.position = 'absolute';
			pixel.innerHTML="<img height=1 width=1/>";
			edgePixels.push( pixel );
			this.container.appendChild(pixel);
		}

		this['edges'][particleA.id][particleB.id] = {
			source: particleA,
			target: particleB,
			edge: edgePixels
		}
		return edgePixels;
	} else {
		return this['edges'][particleA.id][particleB.id].edge;
	}
}

/*
 * Drop edge, eliminating dom element from document
 */
HTMLGraphView.prototype.removeEdge = function( edge ) {
	var domElement = edge.domEdge;
	var particleA = edge.source;
	var particleB = edge.target;
	for( var i=0; i<edge.edge.length; i++ ) {
		this.container.removeChild(edge.edge[i]);		
	}
	delete this['edges'][particleA.id][particleB.id];
}

/*
 * Draw a node at it's current position.
 * 
 * @param {Particle} particle
 */
HTMLGraphView.prototype.drawNode = function( particle ) {
	var domNodeProps = this['nodes'][particle.id];
	if ( domNodeProps ) {
		var domNode = domNodeProps.domElement;

		domNode.style.left = (particle.positionX*this.skewX) - 
			domNodeProps.centerX + this.centerX + 'px';
		domNode.style.top = particle.positionY*this.skewY - 
			domNodeProps.centerY + this.centerY + 'px';

		var e = this.edges[particle.id];
		for ( var t in e ) {
			this.drawEdge( particle, e[t]['target'] );
		}
	}
}

/*
 * Draw an edge at it's current position.
 * 
 * @param {Particle} particleA
 * @param {Particle} particleB
 */
HTMLGraphView.prototype.drawEdge = function ( nodeI, nodeJ ) {
	// get a distance vector between nodes
	var dx = nodeI.positionX - nodeJ.positionX;
	var dy = nodeI.positionY - nodeJ.positionY;
	if (dx == 0 && dy == 0) return;

	var distance = Math.sqrt( dx*dx	+ dy*dy );
		
	var pixels = this['edges'][nodeI.id][nodeJ.id]['edge'];

	// draw a line between particles using the "pixels"
	for ( var k=0, l=pixels.length; k<l; k++ ) {
		var p = (distance / l) * k;
		pixels[k].style.left=parseInt(nodeI.positionX +(-1)*p*(dx/distance))*this.skewX + this.centerX + 'px';
		pixels[k].style.top=parseInt(nodeI.positionY +(-1)*p*(dy/distance))*this.skewY + this.centerY + 'px';
	}
}
	
/*
 * Remove everything from the view.
 */
HTMLGraphView.prototype.clear = function() {
	// first, remove all the edges
	for ( var e in this.edges ) {
		for ( var eb in this.edges[e] ) {
		// get the pixels that make up the edge
			for( var i=0, l=this.edges[e][eb].edge.length; i<l; i++ ) {
				this.container.removeChild( this.edges[e][eb].edge[i] );
			}
		}
	}
		
	this.edges = {};

	// now remove the nodes
	for ( var n in this.nodes ) {
		this.container.removeChild( this.nodes[n].domElement );
	}
		
	this.nodes = {};
}