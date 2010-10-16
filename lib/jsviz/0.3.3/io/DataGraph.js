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
 * DataGraph
 * 
 * @author Kyle Scholz
 * 
 * @version 0.3
 * 
 * A DataGraph defines nodes and edges (relationships between nodes). It's a
 * data model from which all nodes or a subset of nodes may be included in a
 * particle model / view.
 * 
 * A DataGraph will notify subscribers when new nodes and edges have been added.
 * A subscriber must implement "newDataGraphNode" and "newDataGraphEdge".
 */
var DataGraph = function() {
	this.nodes = new Array();	
	this.subscribers = new Array();	
}

/*
 * Subscribe an observer
 * 
 * @param {DataGraphObserver} observer
 */
DataGraph.prototype.subscribe = function( observer ) {
	this.subscribers.push( observer );
}
	
/*
 * Notify subscribers of our new node
 * 
 * @param {DataGraphNode} node
 */
DataGraph.prototype.notifyNode = function( node ) {
	for( var i=0, l=this.subscribers.length; i<l; i++ ) {
		this.subscribers[i].newDataGraphNode( node );
	}
}

/*
 * Notify subscribers of our new edge
 * 
 * @param {DataGraphNode} nodeA
 * @param {DataGraphNode} nodeB
 */
DataGraph.prototype.notifyEdge = function( nodeA, nodeB ) {
	for( var i=0, l=this.subscribers.length; i<l; i++ ) {
		this.subscribers[i].newDataGraphEdge( nodeA, nodeB );
	}
}

/*
 * Add node to the DataGraph.
 * 
 * @param {DataGraphNode} dataGraphNode
 */
DataGraph.prototype.addNode = function( dataGraphNode ) {
	dataGraphNode.id = this.nodes.length;
	dataGraphNode.rendered = false;
	this.nodes.push( dataGraphNode );		
	this.notifyNode( dataGraphNode );
}
	
/*
 * Add an edge between two nodes.
 * 
 * @param {DataGraphNode} nodeA
 * @param {DataGraphNode} nodeB
 */
DataGraph.prototype.addEdge = function( nodeA, nodeB ) {
	var success = nodeA.addEdge( nodeB, 1 );
	if ( success ) {
		this.notifyEdge( nodeA, nodeB );			
	}
}

/**
 * A DataGraphNode is a node in a DataGraph (...duh)
 * 
 * @param fixed indicates whether the node has a fixed position
 */
var DataGraphNode = function() {
	this.edges = {};
	this.edgeCount = 0;
}

/*
 * Add an edge between two nodes.
 * 
 * @param {DataGraphNode} node
 */
DataGraphNode.prototype.addEdge = function( node ) {
	if ( !(node.id in this.edges) && !(this.id in node.edges) && (this.id != node.id) ) {
		this.edgeCount++;
		this.edges[node.id] = node;
		return true;
	}
	return false;
}