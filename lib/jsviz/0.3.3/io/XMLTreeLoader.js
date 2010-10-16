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
 * Seed DataGraph with contents of an XML tree structure.
 * 
 * @author Kyle Scholz
 * 
 * @version 0.3
 */
var XMLTreeLoader = function( dataGraph ) {
	this.http = new HTTP();
	this.subscribers = new Array();
	this.dataGraph = dataGraph;
}

/*
 * @param {Object} subscriber
 */
XMLTreeLoader.prototype.subscribe = function( subscriber ) {
	this.subscribers.push(subscriber);	
}

/*
 * 
 */
XMLTreeLoader.prototype.notify = function() {
	for( var i=0; i<this.subscribers.length; i++ ) {
		this.subscribers[i].notify();
	}
}

/*
 * Fetch XML data for processing
 */
XMLTreeLoader.prototype.load = function( url ) {
	this.http.get( url, this, this.handle );
}
	
/*
 * Process XML data in DataGraph.
 * 
 * @param {XMLHTTPRequest} request
 */
XMLTreeLoader.prototype.handle = function( request ) {
	var xmlDoc = request.responseXML;
	var root = xmlDoc.getElementsByTagName("root")[0];

	// Add Root Node
	var rootNode = new DataGraphNode();
	for( var i=0, l=root.attributes.length; i<l; i++ ) {
		rootNode[root.attributes[i].name]=root.attributes[i].value;
	}
	this.dataGraph.addNode( rootNode );

	// Add children
	this.branch( root, rootNode );
	this.notify();
}

/*
 * @param {Object} root
 * @param {Object} rootNode
 */
XMLTreeLoader.prototype.branch = function( root, rootNode ) {
	var childNodes = root.childNodes;
	for( var i=0, l=childNodes.length; i<l; i++ ){
		if( childNodes[i].nodeName == "node" ) {
			var node = new DataGraphNode();
			node.parent = rootNode;
			for( var j=0, la=childNodes[i].attributes.length; j<la; j++ ) {
				node[childNodes[i].attributes[j].name]=childNodes[i].attributes[j].value;
			}
			this.dataGraph.addNode( node );
			
			this.branch( childNodes[i], node );
		}
	}
}