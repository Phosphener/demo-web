// Utilities for embedded JS.
// Current version: 0.2   Updated by: Xun Guo
// Update date: 21 May 2015

var util = {
  // Calculate the rough size of JSON object.
  // Not used now.
//  roughSizeOfObject : function(object) {
//    var objectList = [];
//
//    var recurse = function( value ) {
//        var bytes = 0;
//
//        if ( typeof value === 'boolean' ) {
//            bytes = 4;
//        } else if ( typeof value === 'string' ) {
//            bytes = value.length * 2;
//        } else if ( typeof value === 'number' ) {
//            bytes = 8;
//        } else if ( typeof value === 'object' &&
//            objectList.indexOf( value ) === -1) {
//            objectList[ objectList.length ] = value;
//
//            for( var i in value ) {
//                bytes+= 8; // an assumed existence overhead
//                bytes+= recurse(value[i]);
//            }
//        }
//        return bytes;
//    };
//    
//    return recurse(object);
//  }
};