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
 * ForceDirectedLayout
 *  
 * @author Kyle Scholz
 * 
 * @version 0.3.3
 * 
 * @param {DOMElement} container
 */
var ForceDirectedLayout = function( container, useVectorGraphics ) {
	
	this.container = container;
	this.containerLeft=0; this.containerTop=0;
	this.containerWidth=0; this.containerHeight=0;

	this.svg = useVectorGraphics && document.implementation.hasFeature("org.w3c.dom.svg", '1.1') ? true : false; 

	// Render model with SVG if it's supported.
	if ( this.svg ) {
		this.view = new SVGGraphView( container, 1 );
	// Otherwise, use HTML.
	} else {
		this.view = new HTMLGraphView( container, 1 );
	}

	// Create the model that we'll use to represent the nodes and relationships 
	// in our graph.
	this.model = new ParticleModel( this.view );
	this.model.start();

	this.setSize();
	
	// for queueing loaders
	this.dataNodeQueue = new Array();
	this.relationshipQueue = new Array();

	// the data graph defines the nodes and edges
	this.dataGraph = new DataGraph();
	this.dataGraph.subscribe( this );
				
	// if this is IE, turn on caching of javascript-loaded images explicitly
	if ( document.all ) {
		document.createStyleSheet().addRule('html', 
			'filter:expression(document.execCommand("BackgroundImageCache", false, true))' );		
	}

	// attach an onresize event
	var resizeEvent = new EventHandler( this, this.setSize );
	if (window.addEventListener) {
		window.addEventListener("resize",resizeEvent,false);
	} else {
		window.attachEvent("onresize",resizeEvent);
	}

	// attach an onmousemove event
	if (window.Event) { document.captureEvents(Event.MOUSEMOVE); }
	var mouseMoveEvent = new EventHandler( this, this.handleMouseMoveEvent );
	if (document.addEventListener) {
		document.addEventListener("mousemove",mouseMoveEvent,false);
	} else {
		document.attachEvent("onmousemove",mouseMoveEvent);
	}

	// attach an onmouseup event
	var mouseUpEvent = new EventHandler( this, this.handleMouseUpEvent );
	if (document.addEventListener) {
		document.addEventListener("mouseup",mouseUpEvent,false);
	} else {
		document.attachEvent("onmouseup",mouseUpEvent);
	}
}

/*
 * Respond to a resize event in the browser.
 */
ForceDirectedLayout.prototype.setSize = function() {
	if ( this.container.tagName == "BODY" ) {
		// Get the size of our window. 
		if (document.all) {
			this.containerWidth = document.body.offsetWidth - 5;
	      	this.containerHeight = document.documentElement.offsetHeight - 5;
		} else {
			this.containerWidth = window.innerWidth - 5;
			this.containerHeight = window.innerHeight - 5;
		}
		this.containerLeft = 0;
		this.containerTop = 0;
	} else {
		this.containerWidth = this.container.offsetWidth;
		this.containerHeight = this.container.offsetHeight;

		this.containerLeft = this.container.offsetLeft;
		this.containerTop = this.container.offsetTop;
	}
	this.view.setSize( this.containerLeft, this.containerTop,
		this.containerWidth, this.containerHeight );
	this.model.setSize( this.containerWidth, this.containerHeight );
	
	this.model.draw( true );
}

/*
 * A default mousemove handler. Moves the selected node and updates child
 * positions according to geometric model.
 * 
 * @param {Object} e
 */
ForceDirectedLayout.prototype.handleMouseMoveEvent = function( e ) {
	if ( this.model.selected && !this.model.particles[this.model.selected].fixed ) {

		// TODO: This is a very temporary fix. In Firefox 2, our EventHandler
		// factory piles mouse events onto the arguments list.
		e = arguments[arguments.length-1];			
		var mouseX = e.pageX ? e.pageX : e.clientX;
		var mouseY = e.pageY ? e.pageY : e.clientY;

		mouseX -= this.view.centerX;
		mouseY -= this.view.centerY;

		// set the node position
		this.model.particles[this.model.selected].positionX=mouseX/this.view.skewX;
		this.model.particles[this.model.selected].positionY=mouseY/this.view.skewY;
		this.model.tick();
    }
}

/*
 * A default mouseup handler. Resets the selected node's position
 * and clears the selection.
 */	
ForceDirectedLayout.prototype.handleMouseUpEvent = function() {
	if ( this.model.selected ) {
		this.model.particles[this.model.selected].selected = false;
		this.model.reset();
		this.model.selected = null;
	}
}

/*
 * A default mousedown handler. Sets the selected node.
 * 
 * @param {Number} id
 */
ForceDirectedLayout.prototype.handleMouseDownEvent = function( id ) {
	this.model.selected = id;
	this.model.particles[id].selected = true;

}

/*
 * Handle a new node.
 *  
 * @param {DataGraphNode} dataNode
 */
ForceDirectedLayout.prototype.newDataGraphNode = function( dataNode ) {
	this.enqueueNode( dataNode );						
}

ForceDirectedLayout.prototype.newDataGraphEdge = function( nodeA, nodeB ) {
	this.enqueueRelationship( nodeA, nodeB );
}

/*
 * Enqueue a node for modeling later.
 * 
 * @param {DataGraphNode} dataNode
 */
ForceDirectedLayout.prototype.enqueueNode = function( dataNode ) {
	this.dataNodeQueue.push( dataNode );
}

/*
 * Dequeue a node and create a particle representation in the model.
 * 
 * @param {DataGraphNode} dataNode
 */
ForceDirectedLayout.prototype.dequeueNode = function() {
	var node = this.dataNodeQueue.shift();
	if ( node ) {
		this.addParticle( node );
		return true;						
	}
	return false;
}

/*
 * Enqueue a relationship for modeling later.
 * 
 * @param {DataGraphNode} nodeA
 * @param {DataGraphNode} nodeB
 */
ForceDirectedLayout.prototype.enqueueRelationship = function( nodeA, nodeB ) {
	this.relationshipQueue.push( {'nodeA': nodeA, 'nodeB': nodeB} );
}

/*
 * Dequeue a node and create a particle representation in the model.
 */
ForceDirectedLayout.prototype.dequeueNode = function() {
	var node = this.dataNodeQueue.shift();
	if ( node ) {
		this.addParticle( node );
		return true;					
	}
	return false;
}

/*
 * Dequeue a relationship and add to the model.
 */
ForceDirectedLayout.prototype.dequeueRelationship = function() {
	var edge = this.relationshipQueue[0]
	if ( edge && edge.nodeA.particle && edge.nodeB.particle ) {
		this.relationshipQueue.shift();
		this.addSimilarity( edge.nodeA, edge.nodeB );						
	}	
}

/*
 * Called by timer to control dequeuing of nodes into addNode.
 */
ForceDirectedLayout.prototype.update = function() {
	this.dequeueNode();
	this.dequeueRelationship();
}

/*
 * Clear all nodes and edges connected to the root.
 */
ForceDirectedLayout.prototype.clear = function( modelNode ) {
	this.model.clear();
}

/*
 * Recenter the graph on the specified node.
 */
ForceDirectedLayout.prototype.recenter = function( modelNode ) {
// todo
}

/*
 * Create a default configuration object with a reference to our layout.
 * 
 * @param {Particle} layout
 */
ForceDirectedLayout.prototype.config = function( layout ) {
	// A default configuration class. This is used if a
	// className was not indicated in your dataNode or if the
	// indicated class was not found.
	this._default={
		model: function( dataNode ) {
			return {
				mass: 1
			};
		},
		view: function( dataNode, modelNode ) {
			return layout.defaultNodeView( dataNode, modelNode );
		}
	}
}

/*
 * Default forces configuration
 */
ForceDirectedLayout.prototype.forces={
	spring: {
		_default: function( nodeA, nodeB, isParentChild ) {
			if (isParentChild) {
				return {
					springConstant: 0.5,
					dampingConstant: 0.2,
					restLength: 20
				}
			} else {
				return {
					springConstant: 0.2,
					dampingConstant: 0.2,
					restLength: 20
				}
			}
		}
	},
	magnet: function() {
		return {
			magnetConstant: -2000,
			minimumDistance: 10
		}
	}
};

/*
 * Add a particle to the model and view.
 * 
 * @param {DataGraphNode} node
 */
ForceDirectedLayout.prototype.addParticle = function( dataNode ) {
	// Create a particle to represent this data node in our model.
	var particle = this.makeNodeModel(dataNode);
	
	var domElement = this.makeNodeView( dataNode, particle );
	this.view.addNode( particle, domElement );

	// Determine if this particle's position should be fixed.
	if ( dataNode.fixed ) { particle.fixed = true; }

	// Assign a random position to the particle.
	var rx = Math.random()*2-1;
	var ry = Math.random()*2-1;
	particle.positionX = rx;
	particle.positionY = ry;

	// Add a Spring Force between child and parent
	if ( dataNode.parent ) {
		particle.positionX = dataNode.parent.particle.positionX + rx;
		particle.positionY = dataNode.parent.particle.positionY + ry;
		var configNode = (dataNode.type in this.forces.spring &&
			dataNode.parent.type in this.forces.spring[dataNode.type]) ? 
			this.forces.spring[dataNode.type][dataNode.parent.type](dataNode, dataNode.parent, true) : 
			this.forces.spring['_default'](dataNode, dataNode.parent, true);
		this.model.makeSpring( particle, dataNode.parent.particle, 
			configNode.springConstant, configNode.dampingConstant, configNode.restLength );

		var props = this.viewEdgeBuilder( dataNode.parent, dataNode );
		this.view.addEdge( particle, dataNode.parent.particle, props );
	}

	// Add repulsive force between this particle and all other particle.
	for( var j=0, l=this.model.particles.length; j<l; j++ ) {
		if ( this.model.particles[j] != particle ) {
			var magnetConstant = this.forces.magnet()['magnetConstant'];
			var minimumDistance = this.forces.magnet()['minimumDistance'];
			this.model.makeMagnet( particle, this.model.particles[j], magnetConstant, minimumDistance );
		}
	}

	dataNode.particle = particle;
	dataNode.viewNode = domElement;
	return dataNode;
}

/*
 * Add a spring force between two edges + corresponding edge in the view.
 * 
 * @param {Number} springConstant
 * @param {DataGraphNode} nodeA
 * @param {DataGraphNode} nodeB
 */
ForceDirectedLayout.prototype.addSimilarity = function( nodeA, nodeB ) {
	var configNode = (nodeA.type in this.forces.spring &&
		nodeB.type in this.forces.spring[nodeA.type]) ? 
		this.forces.spring[nodeA.type][nodeB.parent.type](nodeA,nodeB,false) : 
		this.forces.spring['_default'](nodeA,nodeB,false);

	this.model.makeSpring( nodeA.particle, nodeB.particle,
		configNode.springConstant, configNode.dampingConstant, configNode.restLength );

	var props = this.viewEdgeBuilder( nodeA, nodeB );
	this.view.addEdge( nodeA.particle, nodeB.particle, props );
}

/* Build node views from configuration
 * 
 * @param {DataGraphNode} dataNode
 * @param {SnowflakeNode} modelNode
 */
ForceDirectedLayout.prototype.makeNodeView = function( dataNode, modelNode ) {
	var configNode = (dataNode.type in this.config) ? this.config[dataNode.type] : this.config['_default'];
	return configNode.view( dataNode, modelNode );					
}

/* Build model nodes from configuration
 * 
 * @param {DataGraphNode} dataNode
 */
ForceDirectedLayout.prototype.makeNodeModel = function( dataNode ) {
	var configNode = (dataNode.type in this.config) ? this.config[dataNode.type] : this.config['_default']; 
	for( var attribute in configNode.model(dataNode) ) {
		dataNode[attribute] = configNode.model(dataNode)[attribute];
	}
	var modelNode = this.model.makeParticle( dataNode.mass, 0, 0 );
	return modelNode;
}

/* Default node view builder
 * 
 * @param {SnowflakeNode} modelNode
 * @param {DataNode} dataNode
 */
ForceDirectedLayout.prototype.defaultNodeView = function( dataNode, modelNode ) {
	var nodeElement;
	if ( this.svg ) {
		nodeElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		nodeElement.setAttribute('stroke', '#444444');
		nodeElement.setAttribute('stroke-width', '.25px');
		nodeElement.setAttribute('fill', "#aaaaaa");
		nodeElement.setAttribute('r', 6 + 'px');
		nodeElement.onmousedown =  new EventHandler( this, this.handleMouseDownEvent, modelNode.id )
	} else {
		nodeElement = document.createElement( 'div' );
		nodeElement.style.position = "absolute";
		nodeElement.style.width = "12px";
		nodeElement.style.height = "12px";
		nodeElement.style.backgroundImage = "url(http://kylescholz.com/cgi-bin/bubble.pl?title=&r=12&pt=8&b=444444&c=aaaaaa)";
		nodeElement.innerHTML = '<img width="1" height="1">';
		nodeElement.onmousedown =  new EventHandler( this, this.handleMouseDownEvent, modelNode.id )
	}
	return nodeElement;
}

/* Default edge view builder 
 * 
 * @param {DataNode} dataNodeSrc
 * @param {DataNode} dataNodeDest
 */
ForceDirectedLayout.prototype.makeEdgeView = function( dataNodeSrc, dataNodeDest ) {
	var props;
	if ( this.svg ) {
		props = {
			'stroke': '#888888',
			'stroke-width': '2px',
			'stroke-dasharray': '2,4'
		}
	} else {
		props = {
			'pixelColor': '#888888',
			'pixelWidth': '2px',
			'pixelHeight': '2px',
			'pixels': 5
		}
	}
	return props;
}

ForceDirectedLayout.prototype.viewEdgeBuilder = ForceDirectedLayout.prototype.makeEdgeView;