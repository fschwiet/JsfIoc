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
 * SnowflakeLayout
 * 
 * @author Kyle Scholz
 * 
 * @version 0.3.3
 * 
 * @param {DOMElement} container
 */
var SnowflakeLayout = function( container, useVectorGraphics ) {
	
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
	this.model = new SnowflakeGraphModel( this.view );
	this.model.start();

	this.setSize();
	
	// for queueing loaders
	this.dataNodeQueue = new Array();

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

	this.config = new this.defaultConfig( this );
}

/*
 * Respond to a resize event in the browser.
 */
SnowflakeLayout.prototype.setSize = function() {
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

	var rootNode = this.model.findRoot();
	if ( rootNode ) { this.model.setNodePosition( rootNode, true ); }
}

/*
 * A default mousemove handler. Moves the selected node and updates child
 * positions according to geometric model.
 * 
 * @param {Object} e
 */
SnowflakeLayout.prototype.handleMouseMoveEvent = function( e ) {

	if ( this.model.selected && !this.model.nodes[this.model.selected].fixed ) {
// TODO: This is a very temporary fix. In Firefox 2, our EventHandler
// factory piles mouse events onto the arguments list.
		e = arguments[arguments.length-1];
		var mouseX = e.pageX ? e.pageX : e.clientX;
		var mouseY = e.pageY ? e.pageY : e.clientY;
		mouseX -= this.view.centerX;
		mouseY -= this.view.centerY;

		var node = this.model.nodes[this.model.selected];

		if ( node.parent ) {
			// set the node position
			node.positionX=mouseX/this.view.skewX;
// TODO: fix skew
			node.positionY=mouseY/this.view.skewY;

			// determine new angle and radius
			var dx = node.parent.positionX-node.positionX;
			var dy = node.parent.positionY-node.positionY;
			var d = Math.sqrt(dx*dx+dy*dy);

			dx = dx/this.view.skewX;
			dy = dy/this.view.skewY;
// TODO: fix skew

			var t = Math.acos( dx/d ) * (180/Math.PI);
			if ( node.positionY > node.parent.positionY ) {
				t*=(-1);
			}

			t=90-t;
			if ( (node.targetT - t) < -180) {
				t-=360;
			}				
			
			node.rootAngle=t;
			node.positionR=d;
			node.positionT=t;

			node.updateChildren();
			this.model.setNodePosition( node );
		}
	}
}

/*
 * A default mouseup handler. Resets the selected node's position
 * and clears the selection.
 */	
SnowflakeLayout.prototype.handleMouseUpEvent = function() {
	if ( this.model.selected ) {
		var node = this.model.nodes[this.model.selected];
		node.parent.updateChildren();
		this.model.setNodePosition( node.parent );
		this.model.selected = null;
	}
}

/*
 * A default mousedown handler. Sets the selected node.
 * 
 * @param {Number} id
 */
SnowflakeLayout.prototype.handleMouseDownEvent = function( id ) {
	this.model.selected = id;
}

/*
 * Handle a new node.
 *  
 * @param {DataGraphNode} dataNode
 */
SnowflakeLayout.prototype.newDataGraphNode = function( dataNode ) {
	this.enqueueNode( dataNode );						
}

SnowflakeLayout.prototype.newDataGraphEdge = function( nodeA, nodeB ) { }

/*
 * Enqueue a node for modeling later.
 * 
 * @param {DataGraphNode} dataNode
 */
SnowflakeLayout.prototype.enqueueNode = function( dataNode ) {
	this.dataNodeQueue.push( dataNode );
}

/*
 * Dequeue a node and create a particle representation in the model.
 * 
 * @param {DataGraphNode} dataNode
 */
SnowflakeLayout.prototype.dequeueNode = function() {
	var node = this.dataNodeQueue.shift();
	if ( node ) {
		this.addNode( node );
		return true;						
	}
	return false;
}

/*
 * Called by timer to control dequeuing of nodes into addNode.
 */
SnowflakeLayout.prototype.update = function() {
	this.dequeueNode();
}

/*
 * Clear all nodes and edges connected to the root.
 */
SnowflakeLayout.prototype.clear = function( modelNode ) {
	var rootNode = this.model.findRoot(modelNode);
	if ( rootNode ) {
		this.model.removeNode(rootNode);
		this.model.updateQueue = [];
	}
}

/*
 * Recenter the graph on the specified node.
 */
SnowflakeLayout.prototype.recenter = function( modelNode ) {
	var root = this.model.findRoot( modelNode );
	modelNode.emancipate();
	modelNode.targetX = 0;
	modelNode.targetY = 0;
	this.clear( root );
	this.model.updateQueue.push(modelNode);
}

/*
 * Create a default configuration object with a reference to our layout.
 * 
 * @param {SnowflakeLayout} layout
 */
SnowflakeLayout.prototype.defaultConfig = function( layout ) {
	// A default configuration class. This is used if a
	// className was not indicated in your dataNode or if the
	// indicated class was not found.
	this._default={
		model: function( dataNode ) {
			return {
				childRadius: 80,
				fanAngle: dataNode.root ? 360: 120,
				rootAngle: 0
			};
		},
		view: function( dataNode, modelNode ) {
			return layout.defaultNodeView( dataNode, modelNode );
		}
	}
}

/*
 * Add a particle to the model and view.
 * 
 * @param {DataGraphNode} node
 */
SnowflakeLayout.prototype.addNode = function( dataNode ) {
	var modelNode = this.makeNodeModel(dataNode);
	
	var domElement = this.makeNodeView( dataNode, modelNode );
	var viewNode = this.view.addNode( modelNode, domElement );

	dataNode.modelNode = modelNode;
	dataNode.viewNode = viewNode;
	return dataNode;
}

/* Build node views from configuration
 * 
 * @param {DataGraphNode} dataNode
 * @param {SnowflakeNode} modelNode
 */
SnowflakeLayout.prototype.makeNodeView = function( dataNode, modelNode ) {
	var configNode = (dataNode.type in this.config) ? this.config[dataNode.type] : this.config['_default'];
	return configNode.view( dataNode, modelNode );					
}

/* Build model nodes from configuration
 * 
 * @param {DataGraphNode} dataNode
 */
SnowflakeLayout.prototype.makeNodeModel = function( dataNode ) {
	var configNode = (dataNode.type in this.config) ? this.config[dataNode.type] : this.config['_default']; 
	for( var attribute in configNode.model(dataNode) ) {
		dataNode[attribute] = configNode.model(dataNode)[attribute];
	}
	var modelNode = this.model.addNode( dataNode.childRadius, dataNode.fanAngle, dataNode.rootAngle );
	if ( dataNode.parent ) {
		dataNode.parent.modelNode.addChild(modelNode);

		modelNode.positionX = dataNode.parent.modelNode.positionX;
		modelNode.positionY = dataNode.parent.modelNode.positionY;

		var props = this.viewEdgeBuilder(dataNode.parent, dataNode);
		this.view.addEdge(modelNode, dataNode.parent.modelNode, props);
		return modelNode;
	} else {
		this.model.updateQueue.push( modelNode );
		return modelNode;
	}
}

/* Default node view builder
 * 
 * @param {SnowflakeNode} modelNode
 * @param {DataNode} dataNode
 */
SnowflakeLayout.prototype.defaultNodeView = function( dataNode, modelNode ) {
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
SnowflakeLayout.prototype.makeEdgeView = function( dataNodeSrc, dataNodeDest ) {
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

SnowflakeLayout.prototype.viewEdgeBuilder = SnowflakeLayout.prototype.makeEdgeView;