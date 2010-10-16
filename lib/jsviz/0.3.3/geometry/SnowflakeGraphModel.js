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
 * SnowflakeNode
 * 
 * @author Kyle Scholz
 * 
 * Represents a node in a Snowflake Graph.
 */
var SnowflakeNode = function( id, radius, fanAngle, rootAngle ) {
	this['relSize']=1;

	// Represents the angle of entry of this node's parent edge ...
	this['rootAngle'] = parseInt(rootAngle);

	// Each node knows it's parent.
	this['parent'];

	// Branch weight represents the weight of all of this node's children. 
	this['branchWeight']=0;

	// A unique identifier
	this['id'] = id;

	// Indicates the radius (or length of edges rooted in this node)
	this['radius'] = radius;

	// Indicates the angle that can be filled with this nodes children.
    this['fanAngle'] = fanAngle;

	// Target Angle and Radius
	this.targetX = 0;
	this.targetY = 0;
	this.targetT = 0;
	this.targetR = 0;

	// Current Position
	this.positionX = 0;
	this.positionY = 0;
	this.positionT = 0;
	this.positionR = 0;

	// This node's children
	this['children'] = new Array();
}
	
/* 
 * Increments this branch's weight.
 */
SnowflakeNode.prototype.incrementBranchWeight = function() {
	this.branchWeight++;
	if ( this.parent ) { this.parent.incrementBranchWeight(); }
}

/*
 * Adds a child to this node. 
 */	
SnowflakeNode.prototype.addChild = function( node ) {
	this['children'].push(node);
	node['parent'] = this;
	node.positionT = this['rootAngle'];
	this.incrementBranchWeight();
	this.updateChildren();
	return node;
}

/*
 * ...Doesn't actually destroy the node. The is a recursive method that
 * identifies all of the members of a branch and breaks parent-child
 * relationships.
 */
SnowflakeNode.prototype.destroy = function() {
	var destroyed = [];
	for ( var i=0; i<this['children'].length; i++ ) {
		destroyed.push( this['children'][i].id );
		this['children'][i].parent = null;
		destroyed = destroyed.concat( this['children'][i].destroy() );		
	}
	this.children = [];
	return destroyed;
}

/*
 * Seperate node from it's parent
 */
SnowflakeNode.prototype.emancipate = function() {
	if ( this.parent ) {
		for( var i=0, l=this.parent.children.length; i<l; i++ ) {
			if ( this.parent.children[i]==this ) {
				this.parent.children.splice(i,1);
			}
		}
	}
	this.parent = null;
}

/*
 * Updates target positions for a set of child nodes any time the set of
 * child nodes changes.
 */
SnowflakeNode.prototype.updateChildren = function() {
	var partitions = 0;
	for ( var i=0; i<this['children'].length; i++ ) {
		partitions += this['children'][i].relSize;
	}

	// for each child node, calculate a new target
	for ( var i=0, l=this['children'].length; i<l; i++ ) {
		var angle;

		// Make an "only child" follow it's parent's path.
		if ( this['children'].length == 1 ) {
			angle=this['rootAngle'];
			// Otherwise, theta is a function of the number of child nodes and
			// the fanAngle that has been specified that they must fit in.
			// ...place the child in the middle of it's partition
		} else {
			angle=(this['fanAngle']/(partitions)*i) + this['rootAngle'] - 
			(this['fanAngle']/(partitions)*(partitions-1))/2;
		}
		var node = this['children'][i];
		node.rootAngle = parseInt(angle);
		node.targetT = angle;
		node.targetR = this['radius'];
		node.updateChildren();
	}
}

/**
 * SnowflakeGraphModel:
 * 
 * Performs positioning on nodes.
 * 
 * @extends GraphModel
 */
var SnowflakeGraphModel = function( view ) {
	this.view=view;

	this.nodes={};
	this.selected = null;
		
	this.timer = new Timer( 1 );		
	this.timer.subscribe( this );
	
	// A collection  of root nodes
	this.updateQueue = new Array();

	this.updateCollection = {};

	//
	this.nextUID = 0;

	// A constant that dictates the smoothness of animation. We'll always make a
	// tradeoff between smoothness and speed (or resource utilization). For 
	// different graph applications, different fluidity values will be
	// appropriate.
	//
	// In this animation, fluidity is used to controls the distance traversed in
	// each tick, in the functions: newTheta=(theta-targetTheta)/ 
	this.fluidity = 2.5;

	// A boolean that indicates whether this graph should stagger node positions
	// for readability.
	this.doStagger = false;

	this.staggerPixels = 30;
}

/*
 * Start animation timer.
 */
SnowflakeGraphModel.prototype.start = function() {
	this.timer.start();
}

/*
 * Stop animation timer.
 */	
SnowflakeGraphModel.prototype.stop = function() {
	this.timer.stop();
}

/*
 * Perform an animation tick.
 */
SnowflakeGraphModel.prototype.update = function() {
	var m = 0;
	for( var i=0; i<this.updateQueue.length; i++ ) {
		m = this.setNodePosition( this.updateQueue[i] );	
	}
	if ( m == 0 ) {	return 100; }
	return 1;	
}
		
/*
 * Move node closer to target.
 */
SnowflakeGraphModel.prototype.setNodePosition = function( node, force, i ) {
	var m = 0;
	if (!i) { i=0; }
	if ( node.parent ) {
		var dt = (node.positionT - node.targetT);
		var dr = (node.positionR - node.targetR);

		if ( force || ((Math.abs(dt)>1 || Math.abs(dr)>1) && !(this.selected==node.id)) ) {
			node.positionT -= (dt / this['fluidity']);
			node.positionR -= (dr / this['fluidity']);

			// Determine if we should stagger			
			var stagger = 0;
			if ( this.doStagger && i % 2 ) { stagger = this.staggerPixels; }
	
			// Set coordinates based on angle and radius			
			node.positionY = node.parent.positionY - 
				(Math.cos(node.positionT*(Math.PI/180)) * 
				(node.positionR+stagger));
	
		    node.positionX = node.parent.positionX - 
				(Math.sin(node.positionT*(Math.PI/180)) * 
				(node.positionR+stagger));

			this.view.drawNode( node );
			m = 1;
		} else if ( this.selected == node.id ) {
			this.view.drawNode( node );				
		}
	} else {
		// are we migrating a root node?
		// Get new coordinate values for this node
		var dx = (node.positionX - node.targetX);
		var dy = (node.positionY - node.targetY);

		if ( force || (Math.abs(dx)>1 || Math.abs(dy)>1) ) {
			node.positionX -= (dx / this['fluidity']);
			node.positionY -= (dy / this['fluidity']);			
			node.updateChildren();
			this.view.drawNode( node );
		}
	}

	for ( var i=0, l=node.children.length; i<l; i++ ) {
		m += this.setNodePosition( node['children'][i], force, i );	
	}
	return m;
}
	
/*
 * Add a new SnowflakeNode.
 */
SnowflakeGraphModel.prototype.addNode = function( radius, fanAngle, rootAngle ) {
	var id = this['nextUID']++;
	var node = new SnowflakeNode( id, radius, fanAngle, rootAngle );
	this.nodes[id]=node;
	return node;
}

/*
 * Remove a node (and all of it's children, of course)
 */
SnowflakeGraphModel.prototype.removeNode = function( modelNode ) {
	var destroyed = modelNode.destroy();
	for( var i=0, l=this.updateQueue.length; i<l; i++ ) {
		if ( this.updateQueue[i]==modelNode ) {
			this.updateQueue.splice(i,1);
		}
	}
	for( var i=0, l=destroyed.length; i<l; i++ ) {
		this.view.removeNode( this.nodes[destroyed[i]] );
		delete this.nodes[destroyed[i]];		
	}
	delete this.nodes[modelNode.id];
	this.view.removeNode( modelNode );
}

/*
 * Find the root of this node. This model may have multiple roots, so this
 * requires a recursive traversal.
 */
SnowflakeGraphModel.prototype.findRoot = function(node) {
	if ( !node && this.updateQueue.length>0 ) {
		return this.findRoot( this.updateQueue[0] );
	} else if ( !node ) {
		return null;		
	} else if ( node.parent) {
		return this.findRoot(node.parent);
	} else {
		return node;
	}
}