/*! xLabsAnalytics - v0.0.1 - 2015-08-24 */ 

var xa = ( function() { 
//SERVER_HOST = "http://api.pinkpineapple.me";
//FRONT_END_HOST = "http://";
SERVER_HOST = "http://127.0.0.1:3000";
FRONT_END_HOST = "http://127.0.0.1:8000";

// Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
// This work is free. You can redistribute it and/or modify it
// under the terms of the WTFPL, Version 2
// For more information see LICENSE.txt or http://www.wtfpl.net/
//
// For more information, the home page:
// http://pieroxy.net/blog/pages/lz-string/testing.html
//
// LZ-based compression algorithm, version 1.4.3
var LZString = (function() {

// private property
var f = String.fromCharCode;
var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
var baseReverseDic = {};

function getBaseValue(alphabet, character) {
  if (!baseReverseDic[alphabet]) {
    baseReverseDic[alphabet] = {};
    for (var i=0 ; i<alphabet.length ; i++) {
      baseReverseDic[alphabet][alphabet[i]] = i;
    }
  }
  return baseReverseDic[alphabet][character];
}

var LZString = {
  compressToBase64 : function (input) {
    if (input == null) return "";
    var res = LZString._compress(input, 6, function(a){return keyStrBase64.charAt(a);});
    switch (res.length % 4) { // To produce valid Base64
    default: // When could this happen ?
    case 0 : return res;
    case 1 : return res+"===";
    case 2 : return res+"==";
    case 3 : return res+"=";
    }
  },

  decompressFromBase64 : function (input) {
    if (input == null) return "";
    if (input == "") return null;
    return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrBase64, input.charAt(index)); });
  },

  compressToUTF16 : function (input) {
    if (input == null) return "";
    return LZString._compress(input, 15, function(a){return f(a+32);}) + " ";
  },

  decompressFromUTF16: function (compressed) {
    if (compressed == null) return "";
    if (compressed == "") return null;
    return LZString._decompress(compressed.length, 16384, function(index) { return compressed.charCodeAt(index) - 32; });
  },

  //compress into uint8array (UCS-2 big endian format)
  compressToUint8Array: function (uncompressed) {
    var compressed = LZString.compress(uncompressed);
    var buf=new Uint8Array(compressed.length*2); // 2 bytes per character

    for (var i=0, TotalLen=compressed.length; i<TotalLen; i++) {
      var current_value = compressed.charCodeAt(i);
      buf[i*2] = current_value >>> 8;
      buf[i*2+1] = current_value % 256;
    }
    return buf;
  },

  //decompress from uint8array (UCS-2 big endian format)
  decompressFromUint8Array:function (compressed) {
    if (compressed===null || compressed===undefined){
        return LZString.decompress(compressed);
    } else {
        var buf=new Array(compressed.length/2); // 2 bytes per character
        for (var i=0, TotalLen=buf.length; i<TotalLen; i++) {
          buf[i]=compressed[i*2]*256+compressed[i*2+1];
        }

        var result = [];
        buf.forEach(function (c) {
          result.push(f(c));
        });
        return LZString.decompress(result.join(''));

    }

  },


  //compress into a string that is already URI encoded
  compressToEncodedURIComponent: function (input) {
    if (input == null) return "";
    return LZString._compress(input, 6, function(a){return keyStrUriSafe.charAt(a);});
  },

  //decompress from an output of compressToEncodedURIComponent
  decompressFromEncodedURIComponent:function (input) {
    if (input == null) return "";
    if (input == "") return null;
    input = input.replace(/ /g, "+");
    return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrUriSafe, input.charAt(index)); });
  },

  compress: function (uncompressed) {
    return LZString._compress(uncompressed, 16, function(a){return f(a);});
  },
  _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
    if (uncompressed == null) return "";
    var i, value,
        context_dictionary= {},
        context_dictionaryToCreate= {},
        context_c="",
        context_wc="",
        context_w="",
        context_enlargeIn= 2, // Compensate for the first entry which should not count
        context_dictSize= 3,
        context_numBits= 2,
        context_data=[],
        context_data_val=0,
        context_data_position=0,
        ii;

    for (ii = 0; ii < uncompressed.length; ii += 1) {
      context_c = uncompressed[ii];
      if (!Object.prototype.hasOwnProperty.call(context_dictionary,context_c)) {
        context_dictionary[context_c] = context_dictSize++;
        context_dictionaryToCreate[context_c] = true;
      }

      context_wc = context_w + context_c;
      if (Object.prototype.hasOwnProperty.call(context_dictionary,context_wc)) {
        context_w = context_wc;
      } else {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
          if (context_w.charCodeAt(0)<256) {
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<8 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          } else {
            value = 1;
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1) | value;
              if (context_data_position ==bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = 0;
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<16 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }


        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        // Add wc to the dictionary.
        context_dictionary[context_wc] = context_dictSize++;
        context_w = String(context_c);
      }
    }

    // Output the code for w.
    if (context_w !== "") {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
        if (context_w.charCodeAt(0)<256) {
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
          }
          value = context_w.charCodeAt(0);
          for (i=0 ; i<8 ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        } else {
          value = 1;
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1) | value;
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = 0;
          }
          value = context_w.charCodeAt(0);
          for (i=0 ; i<16 ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        delete context_dictionaryToCreate[context_w];
      } else {
        value = context_dictionary[context_w];
        for (i=0 ; i<context_numBits ; i++) {
          context_data_val = (context_data_val << 1) | (value&1);
          if (context_data_position == bitsPerChar-1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }


      }
      context_enlargeIn--;
      if (context_enlargeIn == 0) {
        context_enlargeIn = Math.pow(2, context_numBits);
        context_numBits++;
      }
    }

    // Mark the end of the stream
    value = 2;
    for (i=0 ; i<context_numBits ; i++) {
      context_data_val = (context_data_val << 1) | (value&1);
      if (context_data_position == bitsPerChar-1) {
        context_data_position = 0;
        context_data.push(getCharFromInt(context_data_val));
        context_data_val = 0;
      } else {
        context_data_position++;
      }
      value = value >> 1;
    }

    // Flush the last char
    while (true) {
      context_data_val = (context_data_val << 1);
      if (context_data_position == bitsPerChar-1) {
        context_data.push(getCharFromInt(context_data_val));
        break;
      }
      else context_data_position++;
    }
    return context_data.join('');
  },

  decompress: function (compressed) {
    if (compressed == null) return "";
    if (compressed == "") return null;
    return LZString._decompress(compressed.length, 32768, function(index) { return compressed.charCodeAt(index); });
  },

  _decompress: function (length, resetValue, getNextValue) {
    var dictionary = [],
        next,
        enlargeIn = 4,
        dictSize = 4,
        numBits = 3,
        entry = "",
        result = [],
        i,
        w,
        bits, resb, maxpower, power,
        c,
        data = {val:getNextValue(0), position:resetValue, index:1};

    for (i = 0; i < 3; i += 1) {
      dictionary[i] = i;
    }

    bits = 0;
    maxpower = Math.pow(2,2);
    power=1;
    while (power!=maxpower) {
      resb = data.val & data.position;
      data.position >>= 1;
      if (data.position == 0) {
        data.position = resetValue;
        data.val = getNextValue(data.index++);
      }
      bits |= (resb>0 ? 1 : 0) * power;
      power <<= 1;
    }

    switch (next = bits) {
      case 0:
          bits = 0;
          maxpower = Math.pow(2,8);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
        c = f(bits);
        break;
      case 1:
          bits = 0;
          maxpower = Math.pow(2,16);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
        c = f(bits);
        break;
      case 2:
        return "";
    }
    dictionary[3] = c;
    w = c;
    result.push(c);
    while (true) {
      if (data.index > length) {
        return "";
      }

      bits = 0;
      maxpower = Math.pow(2,numBits);
      power=1;
      while (power!=maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position == 0) {
          data.position = resetValue;
          data.val = getNextValue(data.index++);
        }
        bits |= (resb>0 ? 1 : 0) * power;
        power <<= 1;
      }

      switch (c = bits) {
        case 0:
          bits = 0;
          maxpower = Math.pow(2,8);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }

          dictionary[dictSize++] = f(bits);
          c = dictSize-1;
          enlargeIn--;
          break;
        case 1:
          bits = 0;
          maxpower = Math.pow(2,16);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
          dictionary[dictSize++] = f(bits);
          c = dictSize-1;
          enlargeIn--;
          break;
        case 2:
          return result.join('');
      }

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }

      if (dictionary[c]) {
        entry = dictionary[c];
      } else {
        if (c === dictSize) {
          entry = w + w[0];
        } else {
          return null;
        }
      }
      result.push(entry);

      // Add w+entry[0] to the dictionary.
      dictionary[dictSize++] = w + entry[0];
      enlargeIn--;

      w = entry;

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }

    }
  }
};
  return LZString;
})();

if (typeof define === 'function' && define.amd) {
  define(function () { return LZString; });
} else if( typeof module !== 'undefined' && module != null ) {
  module.exports = LZString
}


var Mouse = {

  // Callbacks
  mouseDownCallback : null,
  mouseMoveCallback : null,
  mouseUpCallback   : null,

  // Mouse movement logging
  xMouseScreen : 0, 
  yMouseScreen : 0,

  // Mouse press logging
  bMouseDown : false,

  xMouseScreenDown : 0,
  yMouseScreenDown : 0,
  tMouseScreenDown : 0,

  xMouseScreenUp : 0,
  yMouseScreenUp : 0,
  tMouseScreenUp : 0,

  // Functions
  addMouseListeners : function() {
    window.addEventListener( "mousemove", function( e ) {
      Mouse.onMouseMove( e );
    }, false );

    window.addEventListener( "mousedown",function(e) {
      Mouse.onMouseDown( e );
    }, false );

    window.addEventListener( "mouseup",function(e) {
      Mouse.onMouseUp( e );
    }, false );
  }, 

  getMouseScreenX : function( mouseEvent ) {
      if( xLabs.config == null ) {
        return mouseEvent.screenX;
      }

      if( xLabs.getConfig( "browser.mouse.absScreenCoordinates" ) == "1" ) {
        return mouseEvent.screenX;
      }
      else {
        return mouseEvent.screenX + window.screenX;
      }
  },

  getMouseScreenY : function( mouseEvent ) {
      if( xLabs.config == null ) {
        return mouseEvent.screenY;
      }

      //if( xLabsContent.config.browser.mouse.absScreenCoordinates == 1 ) {
      if( xLabs.getConfig( "browser.mouse.absScreenCoordinates" ) == "1" ) {
        return mouseEvent.screenY;
      }
      else {
        return mouseEvent.screenY + window.screenY;
      }
  },

  onMouseMove : function( e ) {
    // Save the current mouse position
    Mouse.xMouseScreen = Mouse.getMouseScreenX( e );
    Mouse.yMouseScreen = Mouse.getMouseScreenY( e );
    
    if( Mouse.mouseMoveCallback != null ) {
      Mouse.mouseMoveCallback();
    }
  },

  onMouseDown : function( e ) {
    Mouse.bMouseDown = true;

    var xScreen = Mouse.getMouseScreenX( e );
    var yScreen = Mouse.getMouseScreenY( e );

    Mouse.xMouseScreenDown = xScreen;
    Mouse.yMouseScreenDown = yScreen;
    Mouse.tMouseScreenDown = xLabs.getTimestamp();

    if( Mouse.mouseDownCallback != null ) {
      Mouse.mouseDownCallback();
    }
  },

  onMouseUp : function( e ) {
    Mouse.bMouseDown = false;

    var xScreen = Mouse.getMouseScreenX( e );
    var yScreen = Mouse.getMouseScreenY( e );

    Mouse.xMouseScreenUp = xScreen;
    Mouse.yMouseScreenUp = yScreen;
    Mouse.tMouseScreenUp = xLabs.getTimestamp();

    if( Mouse.mouseUpCallback != null ) {
      Mouse.mouseUpCallback();
    }
  },

  setup : function() {
    Mouse.addMouseListeners();
  }

};

Mouse.setup();

/*

sizeof.js

A function to calculate the approximate memory usage of objects

Created by Stephen Morley - http://code.stephenmorley.org/ - and released under
the terms of the CC0 1.0 Universal legal code:

http://creativecommons.org/publicdomain/zero/1.0/legalcode

*/

/* Returns the approximate memory usage, in bytes, of the specified object. The
 * parameter is:
 *
 * object - the object whose size should be determined
 */
function sizeof(object){

  // initialise the list of objects and size
  var objects = [object];
  var size    = 0;

  // loop over the objects
  for (var index = 0; index < objects.length; index ++){

    // determine the type of the object
    switch (typeof objects[index]){

      // the object is a boolean
      case 'boolean': size += 4; break;

      // the object is a number
      case 'number': size += 8; break;

      // the object is a string
      case 'string': size += 2 * objects[index].length; break;

      // the object is a generic object
      case 'object':

        // if the object is not an array, add the sizes of the keys
        if (Object.prototype.toString.call(objects[index]) != '[object Array]'){
          for (var key in objects[index]) size += 2 * key.length;
        }

        // loop over the keys
        for (var key in objects[index]){

          // determine whether the value has already been processed
          var processed = false;
          for (var search = 0; search < objects.length; search ++){
            if (objects[search] === objects[index][key]){
              processed = true;
              break;
            }
          }

          // queue the value to be processed if appropriate
          if (!processed) objects.push(objects[index][key]);

        }

    }

  }

  // return the calculated size
  return size;

}


var xLabs = {

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Variables
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  token : null, // cached locally because it's inconvenient to send every time and for backwards compatibility
  config : null,
  callbackReady : null,
  callbackState : null,
  callbackIdPath : null,
  apiReady : false,

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Core API
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  isApiReady : function() {
    return !!xLabs.apiReady;
  },

  getConfig : function( path ) {
    var value = xLabs.getObjectProperty( xLabs.config, path );
    //console.log( "getConfig( "+path+" = "+ value + " )" );
    return value;
  },

  setConfig : function( path, value ) {
    window.postMessage( { 
      target: "xLabs", 
      token: xLabs.token, // may be null
      config: { 
        path: path, 
        value: value
      } 
    }, "*" );
  },

  setToken : function( token ) {
    // console.log("setToken() called")
    xLabs.token = token;

    // Send a message to extension content_script so that the token is saved.
    // Otherwise, when the timer kicks in to do a check for permission, the token
    // is cached in the content_script yet, and will fail.
    window.postMessage( {
      target: "xLabs",
      token: xLabs.token, // may be null
      config: null
    }, "*" );
  },

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // JSON
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  getObjectProperty : function( object, path ) {
    if( ( object == undefined ) || ( object == null ) ) {
      return "";
    }
    //console.log( "Uril util"+path );
    var parts = path.split('.'),
        last = parts.pop(),
        l = parts.length,
        i = 1,
        current = parts[ 0 ];

    while( ( object = object[ current ] ) && i < l ) {
      current = parts[ i ];
      //console.log( "Util object: "+JSON.stringify( object ) );
      i++;
    }

    if( object ) {
      //console.log( "Util result: "+object[ last ] );
      return object[ last ];
    }
  },

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Calibration
  // Truth - data for gaze calibration. Basically you need to tell xLabs where the person is looking
  // at a particular time. 
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  t1 : 0,

  resetCalibrationTruth : function() {
    xLabs.t1 = 0;
  },

  updateCalibrationTruth : function( xScreen, yScreen ) {
    var t1 = xLabs.t1;
    var t2 = xLabs.getTimestamp();

    if( t1 <= 0 ) { // none set
      t1 = t2;
      t2 = t2 +1; // ensure duration at least 1 and positive
    }

    xLabs.addCalibrationTruth( t1, t2, xScreen, yScreen );

    xLabs.t1 = t2; // change the timestamp
  },

  addCalibrationTruth : function( t1, t2, xScreen, yScreen ) {
    // Defines ordering of values
    // t1,t2,xs,ys
    // For truth, also used for clicks
    var csv = t1 + "," + t2 + "," + parseInt( xScreen  ) + "," + parseInt( yScreen );
    //console.log( "xLabs truth: "+csv );
    xLabs.setConfig( "truth.append", csv );    
  },

  calibrate : function( id ) {
    var request = "3p";
    if( id ) {
      request = id;
    }
    
    xLabs.setConfig( "calibration.request", request );    
    console.log( "xLabs: Calibrating..." );
  },

  calibrationClear : function() {
    xLabs.setConfig( "calibration.clear", request );    
    console.log( "xLabs: Clearing calibration..." );
  },

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Time - in a compatible format.
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  getTimestamp : function() {
    // unified function to get suitable timestamps
    var dateTime = new Date();
    var timestamp = dateTime.getTime();
    return timestamp;
  },

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Resolution
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  getDpi : function() {
    var dppx = window.devicePixelRatio ||
      (    window.matchMedia 
        && window.matchMedia( "(min-resolution: 2dppx), (-webkit-min-device-pixel-ratio: 1.5),(-moz-min-device-pixel-ratio: 1.5),(min-device-pixel-ratio: 1.5)" ).matches? 2 : 1 )
      || 1;

    var w = ( screen.width  * dppx );
    var h = ( screen.height * dppx );
    return this.calcDpi( w, h, 13.3, 'd' );
  },

  calcDpi : function( w, h, d, opt ) {
    // Calculate PPI/DPI
    // Source: http://dpi.lv/
    w>0 || (w=1);
    h>0 || (h=1);
    opt || (opt='d');
    var dpi = (opt=='d' ? Math.sqrt(w*w + h*h) : opt=='w' ? w : h) / d;
    return dpi>0 ? Math.round(dpi) : 0;
  }, 

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Coordinate conversion
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  devicePixelRatio : function() {
    var ratio = parseFloat( xLabs.getConfig("browser.screen.devicePixelRatioWithoutZoom") );
    if( !ratio ) {
      return null
    }
    var ratio = parseInt( ratio );
    if( ratio === 0 ) {
      return null;
    }
    return window.devicePixelRatio / ratio;
  },


  documentOffset : function() {
    if( !xLabs.documentOffsetReady() ) {
      throw "xLabs: Should not call scr2doc() unless mouse moved, i.e. browser.document.offset.ready == 1";
    }
    var x = parseInt( xLabs.getConfig( "browser.document.offset.x" ) );
    var y = parseInt( xLabs.getConfig( "browser.document.offset.y" ) );
    return { x: x, y: y };
  },

  documentOffsetReady : function() {
    var ready = xLabs.getConfig( "browser.document.offset.ready" );
    if( ready.localeCompare( "1" ) != 0 ) {
      return false;
    }
    return true;
  },

  scr2docX: function( screenX ) {
    if( !xLabs.documentOffsetReady() ) {
      throw "xLabs: Should not call scr2doc() unless mouse moved, i.e. browser.document.offset.ready == 1";
    }

    var xOffset = parseInt(xLabs.getConfig( "browser.document.offset.x" ));
    return screenX - window.screenX - xOffset;
  },

  scr2docY: function( screenY ) {
    if( !xLabs.documentOffsetReady() ) {
      throw "xLabs: Should not call scr2doc() unless mouse moved, i.e. browser.document.offset.ready == 1";
    }

    var yOffset = parseInt(xLabs.getConfig( "browser.document.offset.y" ));
    return screenY - window.screenY - yOffset;
  },

  scr2doc: function( screenX, screenY ) {
    return {
      x: xLabs.scr2docX( screenX ),
      y: xLabs.scr2docY( screenY )
    }
  },

  doc2scrX: function( documentX ) {
    if( !xLabs.documentOffsetReady() ) {
      throw "xLabs: Should not call scr2doc() unless mouse moved, i.e. browser.document.offset.ready == 1";
    }
    var xOffset = parseInt(xLabs.getConfig( "browser.document.offset.x" ));
    return documentX + window.screenX + xOffset;
  },

  doc2scrY: function( documentY ) {
    if( !xLabs.documentOffsetReady() ) {
      throw "xLabs: Should not call scr2doc() unless mouse moved, i.e. browser.document.offset.ready == 1";
    }
    var yOffset = parseInt(xLabs.getConfig( "browser.document.offset.y" ));
    return documentY + window.screenY + yOffset;
  },

  doc2scr: function( documentX, documentY ) {
    return {
      x: xLabs.doc2scrX( documentX ),
      y: xLabs.doc2scrY( documentY )
    }
  },

  ///////////////////////////////////////////////////////////////////////////////////////////////////
  // Setup
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  onApiReady : function() {
    xLabs.apiReady = true;
    if( xLabs.callbackReady != null ) {
      xLabs.callbackReady();
    }
  },

  onApiState : function( config ) {
    xLabs.config = config;
    if( xLabs.callbackState != null ) {
      xLabs.callbackState();
    }
  },

  onApiIdPath : function( detail ) {
    if( xLabs.callbackIdPath != null ) {
      xLabs.callbackIdPath( detail.id, detail.path );
    }
  },

  // Returns the version number of the extension, or null if extension not installed.
  extensionVersion : function() {
    return document.documentElement.getAttribute('data-xlabs-extension-version');
  },

  setup : function( callbackReady, callbackState, callbackIdPath ) {
    if( !xLabs.extensionVersion() ) {
      alert("xLabs chrome extension is not installed");
      return;
    }

    xLabs.callbackReady = callbackReady;
    xLabs.callbackState = callbackState;
    xLabs.callbackIdPath = callbackIdPath;

    if( !!xLabs.apiReady ) {
      xLabs.callbackReady();
    }
  }

};


// add event listeners
document.addEventListener( "xLabsApiReady", function() {
  xLabs.onApiReady();
} );

document.addEventListener( "xLabsApiState", function( event ) {
  xLabs.onApiState( event.detail );
} );

document.addEventListener( "xLabsApiIdPath", function( event ) {
  xLabs.onApiIdPath( event.detail );
} );

// Usage: xLabs.setup( myCallbackFnReady, myCallbackFnState );


// The Embedded JS for participants.
// Current version: 0.4.8 	Updated by: Xun Guo
// Update Date: 27 May 2015

/***********************************************************************/
// > Module that collecting data 
/***********************************************************************/
var embeddedJS = {

  // Debug mode.
  DEBUG: false,

  Session_Key_Route: SERVER_HOST + "/key/session",
  Participant_Key_Route: SERVER_HOST + "/key/participant",
  DataDeliverRoute: SERVER_HOST + "/data",

  // api token 
  api_token: "",

  // session key in window.sessionStorage[session_key]
  session_key_name: "session_key",
  participant_key_name: "participant_key",

  // Variables
  sdk_config: null, // JSON data object.
  data_index: 0, // Data index for each data sent 
  data_array: [], // Data array for sending.
  data_counter: 100, // When data counter >= 1, add JSON data to array.
  // data_counter : 10,   // For test mock up REST API.
  domain: null, // Domain name of the current website.
  url: null, // URL of the current page.
  participant_key: null, // The participant key for current participant.
  session_key: null, // The session key for current session.

  start: function() {
    'use strict';
    // Set xLabs extension to "learning" mode to start calibration.
    xLabs.setConfig("system.mode", "learning");
    //xLabs.setConfig("browser.canvas.paintLearning", "0");

    // Get current domain name and url.
    embeddedJS.domain = document.domain;
    embeddedJS.url = window.location.href;

    // request participant key from server 
    embeddedJS.requestParticipantKey();
    // request new session key from server 
    embeddedJS.requestSessionKey();
    // get session key from sessionStorage
    embeddedJS.session_key = window.sessionStorage[embeddedJS.session_key_name];
    // get participant key from localStorage
    embeddedJS.participant_key = window.localStorage[embeddedJS.participant_key_name];
    console.log(embeddedJS.session_key);
  },

  update: function() {
    'use strict';
    var trackSuspended = parseInt(xLabs.getConfig("state.trackingSuspended"));
    var calibrationStatus = parseInt(xLabs.getConfig("calibration.status"));

    // If not calibrated or tracking suspended, do not send data.
    if ((xLabs.config === null) ||
      // (calibrationStatus === 0) ||
      (trackSuspended == 1)) {
      //console.log( "cs: "+calibrationStatus + " ts="+trackingSuspended );
      return;
    }

    // The whole JSON object, append domain name and URL to the object.
    embeddedJS.sdk_config = xLabs.config;

    // get Tag (component) name of element 
    var element = Tagging.getElement(embeddedJS.sdk_config.state.gaze.measured.x,
      embeddedJS.sdk_config.state.gaze.measured.y);

    // retrieve tags of element
    //embeddedJS.sdk_config.tags = Tagging.retrieveTag(element);
    embeddedJS.sdk_config.tags = Tagging.retrieveAllTags(element);

    // adding data index 
    embeddedJS.sdk_config.dataIndex = embeddedJS.data_index;
    // increment data_index 
    embeddedJS.data_index++;

    console.log("data_index : " + embeddedJS.sdk_config.dataIndex);

    // Build JSON object based on data model.
    // embeddedJS.sdk_config = embeddedJS.build_json(xLabs.config);

    // print sdk_config object 
    console.log(embeddedJS.sdk_config);

    // Packing and compress data.
    var compressedData = embeddedJS.packingData();

    // When finished compression, send data to server.
    if (embeddedJS.data_counter === 0) {
      embeddedJS.sendData(compressedData);

      // Reset data array.
      embeddedJS.data_array = [];
      embeddedJS.data_counter = 100;
      // embeddedJS.data_counter = 10;  	// For testing mock up REST API.
    }

    // console.log(embeddedJS.sdk_config);        
  },

  // Build JSON object based on current config.json.
  build_json: function(config) {
    'use strict';
    var dataObj = {};
    var gazeObj = {};

    if (config == null) {
      return;
    }

    // Timestamp of the data.
    dataObj.timestamp = config.state.timestamp;

    // Calibration status of the data.
    // 0 is in calibration mode; 1 is normal data.
    dataObj.calibrationStatus = config.calibration.status;

    // Confidence value. < 8 is confidence data.
    dataObj.confidence = config.state.calibration.confidence;

    // adding data index 
    dataObj.data_index = embeddedJS.data_index;
    // increment data_index 
    embeddedJS.data_index++;


    // Current gaze coordinate data.
    // dataObj.gaze = config.state.gaze;
    // gazeObj.x = xLabs.scr2docX(config.state.gaze.measured.x);
    // gazeObj.y = xLabs.scr2docY(config.state.gaze.measured.y);
    gazeObj.x = config.state.gaze.measured.x;
    gazeObj.y = config.state.gaze.measured.y;
    dataObj.gaze = gazeObj;

    // Browser parameters. (document parameters seems useless now)
    dataObj.browser_screen = config.browser.screen;
    // dataObj.browser_doc = config.browser.document;

    // Get element id or tag from the coordinates if element exists.
    var element = document.elementFromPoint(gazeObj.x, gazeObj.y);
    if (element !== null) {
      // retrieve tags of element
      //dataObj.tags = Tagging.retrieveTag(element);
      dataObj.tags = Tagging.retrieveAllTags(element);

    } else {
      dataObj.element = "Nil";
    }


    return dataObj;
  },

  // Packing and compress the data object into an array.
  packingData: function() {
    'use strict';
    // Push data object to array if count > 0.
    if (embeddedJS.data_counter > 0) {
      embeddedJS.data_array.push(embeddedJS.sdk_config);
      embeddedJS.data_counter--;
      //console.log("counter: " + embeddedJS.data_counter);
      if (embeddedJS.data_counter > 0) {
        return;
      }
    }

    // When collected 100 data object, compress it.
    var array_json = {};
    array_json.config = embeddedJS.data_array;
    var compressedData = embeddedJS.compressData(array_json);

    // Display compression rate when on debug mode.
    if (embeddedJS.DEBUG) {
      // For single JSON object.
      // embeddedJS.showCompressionRate(embeddedJS.sdk_config);
      // For the JSON data array.
      embeddedJS.showCompressionRate(array_json);
      // Only display once.
      embeddedJS.DEBUG = false;
    }

    return compressedData;
  },

  // Compress data.
  compressData: function(json_obj) {
    'use strict';
    var compressedData =
      LZString.compressToEncodedURIComponent(JSON.stringify(json_obj));

    return compressedData;
  },

  // Decompress data.
  decompressData: function(compressedData) {
    'use strict';
    var decompressed =
      LZString.decompressFromEncodedURIComponent(compressedData);
    // console.log("Decompressed: " + decompressed);

    return decompressed;
  },

  // Display compression rate on the page.
  showCompressionRate: function(originData) {
    'use strict';
    var span = document.createElement("span");
    var br = document.createElement("br");

    console.time("compression");
    var compressedData = embeddedJS.compressData(originData);
    console.timeEnd("compression");

    console.time("decompression");
    var decompressedObj =
      JSON.stringify(JSON.parse(embeddedJS.decompressData(compressedData)));
    console.timeEnd("decompression");

    var compressionRate =
      (sizeof(compressedData) / sizeof(JSON.stringify(originData))) * 100;

    var textMsg =
      document.createTextNode(
        "Size of Json object: " + sizeof(originData) +
        " Size before compress: " + sizeof(JSON.stringify(originData)) +
        " Compressed size: " + sizeof(compressedData) +
        " Decompressed size: " + sizeof(decompressedObj) +
        " Compression rate: " + compressionRate.toFixed(2) + "%");

    span.appendChild(textMsg);
    span.appendChild(br);
    document.body.appendChild(span);
  },

  // Send compressed data, domain name, url and session id to server
  sendData: function(compressedData) {
    // console.log("Compressed length: " + compressedData.length);

    'use strict';
    var data = {};
    data.data = compressedData;
    data.domain = embeddedJS.domain;
    data.url = embeddedJS.url;
    // Append session_key.
    data.session_key = embeddedJS.session_key;
    // Append participant_key.
    data.participant_key = embeddedJS.participant_key;

    console.log("data delivered :");
    console.dir(data);


    // Post JSON object to server to RESTful API.
    $.ajax({
        url: embeddedJS.DataDeliverRoute,
        datatype: "json",
        contentType: "application/json; charset=utf-8",
        processData: false,
        type: "POST",
        crossDomain: true,
        data: JSON.stringify(data)
      })
      .done(function(response) {
        console.log("---------- /data api response -----------");
        console.log(JSON.stringify(response));
      })
      .error(function(ts) {
        console.log("---------- /data api error response -----------");
        console.log(ts.responseText);
      })
      .fail(function() {
        console.log("Error in sending gaze data via /data.");
      });
  },

  // xLabs API
  onXlabsReady: function() {
    'use strict';
    // Clear calibration data and memory buffer.
    xLabs.setConfig("calibration.clear", "1");
    //xLabs.setToken('32eMr5NuNzaxqwUs8');
    xLabs.setToken(embeddedJS.api_token);
    embeddedJS.start();
  },

  onXlabsState: function() {
    'use strict';
    embeddedJS.update();
  },

  // request participant key from server 
  requestParticipantKey: function() {
    'use strict';

    // Get current participant key from server side
    // when there is no participant_key in localStorage
    if (!window.localStorage[embeddedJS.participant_key_name]) {
      $.ajax({
          url: embeddedJS.Participant_Key_Route,
          type: "GET",
          crossDomain: true
        })
        .done(function(data) {
          // store participant key to localStorage;
          window.localStorage[embeddedJS.participant_key_name] = data.participant_key;
          embeddedJS.participant_key = window.localStorage[embeddedJS.participant_key_name];
          console.log("Refresh participant key: " + data.participant_key);
        })
        .error(function(ts) {
          console.log("---------- /key/participant api error response -----------");
          console.log(ts.responseText);
        })
        .fail(function() {
          console.log("Fail to update participant key");
        });
    }
  },

  // request session key from server 
  requestSessionKey: function() {
    'use strict';

    // Get current session id from server side
    // when there is no session_id in sessionStorage
    if (!window.sessionStorage[embeddedJS.session_key_name]) {
      $.ajax({
          url: embeddedJS.Session_Key_Route,
          type: "GET",
          crossDomain: true
        })
        .done(function(data) {
          // store session id to sessionStorage;
          window.sessionStorage[embeddedJS.session_key_name] = data.session_key;
          embeddedJS.session_key = window.sessionStorage[embeddedJS.session_key_name];
          console.log("Refresh session key: " + data.session_key);
        })
        .error(function(ts) {
          console.log("---------- /key/session api error response -----------");
          console.log(ts.responseText);
        })
        .fail(function() {
          console.log("Fail to update session key");
        });
    }
  },

  setup: function() {
    'use strict';
    // Set xLabs extension to "off" mode before user accepted the T's & C's.
    window.addEventListener("beforeunload", function() {
      xLabs.setConfig("system.mode", "off");
    });

    // Update Embedded JS status every 25 milisecond.
    //var updateInterval = 25;
    //setInterval(embeddedJS.update, updateInterval);

    xLabs.setup(embeddedJS.onXlabsReady, embeddedJS.onXlabsState);
  },
};

// embeddedJS.setup();

// For integration test.
if (typeof exports !== 'undefined') {
  exports.embeddedJS = embeddedJS;
}

// The part of Embedded JS is for interacting with frontend
// Current version: 0.1.1 	Updated by: Jin Wang
// Update Date: 16 July 2015


/***********************************************************************/
// > front end support 
/***********************************************************************/
var FrontEndSupport = {

  component_overlay_className: "xa-component-overlay",
  componentPosition: {},

  start: function() {
    'use strict';
    FrontEndSupport.frontEndSupport();
    parent.window.postMessage("ready", "*");
  },

  frontEndSupport: function() {
    'use strict';
    // This is the temporary implementation of the HTML5 postMessage
    // to enable cross domain communication.
    // This allows the FrontEnd to be informed about the location of
    // the tracking components. (via iframe)
    // var componentPosition = {};

    // Listen to the request from the FrontEnd
    window.addEventListener("message", function(event) {

      // Check if the message is from front end.
      // FIXME: Remember to fix me in production. 
      if (event.origin.includes(FRONT_END_HOST)) {
        FrontEndSupport.messageHandler(event);
      }

    }, false);

    window.addEventListener("resize", function(event) {

      // Check if the message is from front end.
      // FIXME: Remember to fix me in production. 
      FrontEndSupport.resize(event);
      console.log("window resize");
      console.dir(event);

    }, false);
  },

  messageHandler: function(event) {

    "use strict";

    var trackedComponents = $('[' + Tagging.attr_xa_track + ']');

    if (event.data == 'location') {
      // Return the document?
      var scrollLeft = window.pageXOffset || document.body.scrollLeft || document.documentElement.scrollLeft;
      var scrollTop = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop;

      trackedComponents.each(function(currentIndex, element) {
        //var componentName = Tagging.retrieveTagName(Tagging.retrieveTag(element));
        var componentName = Tagging.retrieveTag(element).name;
        FrontEndSupport.componentPosition[componentName] = {};
        FrontEndSupport.componentPosition[componentName].left = element.getBoundingClientRect().left + scrollLeft;
        FrontEndSupport.componentPosition[componentName].top = element.getBoundingClientRect().top + scrollTop;
        FrontEndSupport.componentPosition[componentName].width = element.getBoundingClientRect().width;
        FrontEndSupport.componentPosition[componentName].height = element.getBoundingClientRect().height;
      });
      console.log(FrontEndSupport.componentPosition);

      var docHeight = $(document).height();

      $("body").append("<div id='xa-overlay'></div>");


      $('.xa-view').css('background-image', 'url(' + FRONT_END_HOST + '/assets/images/info.png)');

      $("#xa-overlay")
        .height(docHeight)
        .css({
          'opacity': 0,
          'position': 'absolute',
          'top': 0,
          'left': 0,
          'width': '100%',
          'z-index': 5000
        });


      // Return the position information back to
      // the front end. 

      event.source.postMessage(FrontEndSupport.componentPosition, "*");

    } else {
      console.log(event.data);
      var componentOverview = event.data;

      for (name in componentOverview) {
        // attach overview to element 
        FrontEndSupport.componentPosition[name].overview = componentOverview[name];

        FrontEndSupport.createOverlay(FrontEndSupport.componentPosition[name],
          name,
          componentOverview[name]);
      }

      // Register another message handler to add overlay
      // $("body").append(event.data);

      $(".xa-view .xa-mask").on('click', 'a', function(e) {
        var name = $(this).attr("data-overlay-name");
        event.source.postMessage(name, "*");
      });

    }
  },

  createOverlay: function(position, name, descriptions) {
    'use strict';
    var componentOverlay = document.createElement("div");
    $(componentOverlay).addClass(FrontEndSupport.component_overlay_className);
    $(componentOverlay).height(position.height);
    $(componentOverlay).width(position.width);
    $(componentOverlay).offset({
      top: position.top,
      left: position.left
    });
    componentOverlay.style.position = "absolute";
    componentOverlay.style.opacity = "1";
    componentOverlay.style.zIndex = 9998;
    componentOverlay.style.display = "block";

    var viewOverlay = $("#component-overlay").clone();
    viewOverlay.find(".xa-mask h1").text(name);

    viewOverlay.find(".xa-mask h1").after(("<p style=\"font-family: \'Arial\'; font-size: 15px; font-style:none;\">" + 'session time' + ": " + descriptions.sessionTime + "</p>"));
    viewOverlay.find(".xa-mask h1").after(("<p style=\"font-family: \'Arial\'; font-size: 15px; font-style:none;\">" + 'fixation number' + ": " + descriptions.fixationNumber + "</p>"));
    viewOverlay.find(".xa-mask a").attr("data-overlay-name", name);


    $(componentOverlay).append(viewOverlay.html());

    $("body").append(componentOverlay);
  },

  // resize all overlays when window resize 
  resize: function(event) {

    "use strict";

    // remove old overlay 
    $('.' + FrontEndSupport.component_overlay_className).remove();


    // then update overlay with their new position 
    var trackedComponents = $('[' + Tagging.attr_xa_track + ']');
    // Return the document?
    var scrollLeft = window.pageXOffset || document.body.scrollLeft || document.documentElement.scrollLeft;
    var scrollTop = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop;

    trackedComponents.each(function(currentIndex, element) {

      // locate elements and update position of overlay
      var componentName = Tagging.retrieveTag(element).name;
      console.log("update component overlay: " + componentName);
      // update positions 
      FrontEndSupport.componentPosition[componentName].left = element.getBoundingClientRect().left + scrollLeft;
      FrontEndSupport.componentPosition[componentName].top = element.getBoundingClientRect().top + scrollTop;
      FrontEndSupport.componentPosition[componentName].width = element.getBoundingClientRect().width;
      FrontEndSupport.componentPosition[componentName].height = element.getBoundingClientRect().height;

      // update overlay with its new position 
      FrontEndSupport.createOverlay(FrontEndSupport.componentPosition[componentName],
        componentName,
        FrontEndSupport.componentPosition[componentName].overview);
    });
  }
};

// This is to listen to mouse clicking events 
// Current version: 0.1.1 	Updated by: Litao Shen
// Update Date: 16 July 2015


/***********************************************************************/
// > Mouse click events 
/***********************************************************************/
var MouseClickListener = {

  // whether start debugging 
  DEBUG: false,

  MouseClickRoute: SERVER_HOST + "/clicks",

  click_data: null, // including timestamp, tags, and coordinates 

  data_array: [], // Data array for sending mouse click data
  number_data: 100, // number of json object in one data array
  data_counter: null, // When data counter >= 1, add JSON data to array.
  domain: null, // Domain name of the current website.
  url: null, // URL of the current page.
  session_key: null, // The session key for current session.
  participant_key: null, // The participant key for tracking participant 

  /*
   * start listening to mouse click events and send data back 
   */
  start: function() {
    'use strict';

    // initialize data counter 
    MouseClickListener.data_counter = MouseClickListener.number_data;

    // Get current domain name and url.
    MouseClickListener.domain = document.domain;
    MouseClickListener.url = window.location.href;


    // listen to mouse click events 
    Mouse.mouseUpCallback = MouseClickListener.onMouseUp;

    // if window unloaded, send data immediately 
    window.addEventListener("beforeunload", function(event) {

      //event.returnValue = "window unload";
      MouseClickListener.onDataReady();
    });

    return {
      success: "start mouse click event listner"
    };
  },

  /*
   * Listen to mouse click events and send data back 
   */
  onMouseUp: function() {
    'use strict';
    var x = Mouse.xMouseScreen;
    var y = Mouse.yMouseScreen;
    var doc = xLabs.scr2doc(x, y);

    if (MouseClickListener.DEBUG) {
      console.log("click@screen " + x + "," + y);
      console.log("click@ " + doc.x + "," + doc.y);
    }

    MouseClickListener.click_data = MouseClickListener.build_json(xLabs.config, doc);
    // send data to server
    //MouseClickListener.sendData( MouseClickListener.click_data );
    MouseClickListener.packData(MouseClickListener.onDataCollecting,
      MouseClickListener.onDataReady);
    //console.log( "MouseClickListener couter: " + MouseClickListener.data_counter );
  },

  /*
   * pack data  
   */
  packData: function(onDataCollecting, onDataReady) {
    'use strict';

    // if counter is still larger then 0,
    // then continue collecting data into array 
    if (MouseClickListener.data_counter > 0) {
      if (onDataCollecting != null) {
        onDataCollecting();
      }

      MouseClickListener.data_counter--;
      if (MouseClickListener.data_counter > 0) {
        return;
      }
    }

    if (onDataReady != null) {
      onDataReady();
    }

  },

  /*
   * compress and send data when data ready   
   */
  onDataReady: function() {
    'use strict';

    // get session key
    MouseClickListener.session_key = window.sessionStorage[embeddedJS.session_key_name];
    MouseClickListener.participant_key = window.localStorage[embeddedJS.participant_key_name];

    // When collected 100 data object, build data into json.
    var array_json = {};
    array_json.domain = MouseClickListener.domain;
    array_json.url = MouseClickListener.url;
    array_json.session_key = MouseClickListener.session_key;
    array_json.participant_key = MouseClickListener.participant_key;
    array_json.clicks = MouseClickListener.data_array;

    if (MouseClickListener.DEBUG == true) {

      console.log('Mouse click data sent : ---------');
      console.log(array_json);
      console.log('-----------------------');
    }

    MouseClickListener.sendData(array_json);
    MouseClickListener.resetDataArray();

    return {
      success: "done"
    };
  },

  /*
   * push data into data_array    
   */
  onDataCollecting: function() {
    'use strict';

    MouseClickListener.data_array.push(MouseClickListener.click_data);
  },

  /*
   * reset data_array and data_counter     
   */
  resetDataArray: function() {
    'use strict';
    MouseClickListener.data_array = [];
    MouseClickListener.data_counter = MouseClickListener.number_data;
  },

  /*
   * send data via ajax     
   */
  sendData: function(data) {
    'use strict';

    console.log("-----Mouse Click event data :-----");
    console.dir(data);
    // Post JSON object to server via RESTful API.
    $.ajax({
        url: MouseClickListener.MouseClickRoute,
        datatype: "json",
        contentType: "application/json; charset=utf-8",
        processData: false,
        type: "POST",
        crossDomain: true,
        data: JSON.stringify(data)
      })
      .done(function(response) {
        console.log('---------- /clicks api response ----------');
        console.log(JSON.stringify(response));
      })
      .error(function(ts) {
        console.log('---------- /clicks api error response ----------');
        console.log(ts.responseText);

      })
      .fail(function() {
        console.error("Error in sending mouse clicking data via /clicks.");
      });
  },

  /*
   * build json data      
   */
  build_json: function(config, mouseData) {
    'use strict';
    var dataObj = {};

    if (config === null) {
      return;
    }

    // Timestamp of the data.
    dataObj.timestamp = config.state.timestamp;

    // data_index that use to attach click event with eye gaze data 
    dataObj.data_index = embeddedJS.data_index;

    // Browser parameters. (document parameters seems useless now)
    //dataObj.browser_screen = config.browser.screen;
    // dataObj.browser_doc = config.browser.document;

    // Get element id or tag from the coordinates if element exists.
    var element = Tagging.getElement(mouseData.x, mouseData.y);
    // retrieve tags of element
    //embeddedJS.sdk_config.tags = Tagging.retrieveTag(element);
    dataObj.tags = Tagging.retrieveAllTags(element);

    dataObj.x = mouseData.x;
    dataObj.y = mouseData.y;

    //console.log(dataObj.tags[0]);
    return dataObj;
  },
}

// The part of Embedded JS for participants, which used for
// diplaying Term and Conditions.
// Current version: 0.3.1 	Updated by: Litao Shen
// Update Date: 22 May 2015

// the key of cache 
//var web_id = window.location.href;
//var web_info = {};
var asked_key = "asked";
var accept_key = "accept";

// session id in window.localStorage[session_id_key]
var session_id_key = "session_id";


var PermissionForm = {

  text: 'Do you want to continue with Eye Gaze Tracking? <a class="xa_href" href=".">Term & Conditions</a>',

  onAccept: null,
  onReject: null,

  openPermissionForm: function(onAccept, onReject) {
    'use strict';

    PermissionForm.onAccept = onAccept;
    PermissionForm.onReject = onReject;

    // if not asked, open permission form
    PermissionForm.openPermission(PermissionForm.isAsked(), PermissionForm.onAccept, PermissionForm.onReject);
  },

  // open permission form
  openPermission: function(asked, onAccept, onReject) {

    'use strict';

    if (asked) {
      return;
    }
    // if not asked before,
    // generate a warning 
    PermissionForm.generateWarning(PermissionForm.text);
  },

  // check installation of extension
  isExtensionInstalled: function() {

    'use strict';
    var installed = xLabs.extensionVersion();

    console.log(installed ? "Extension is installed." : "Extension is not installed yet.");
    return installed;
  },


  // check whether permission form being popup
  isAsked: function() {

    'use strict';

    // if not ask, then generate noty and return false;
    // else return true;
    if (!localStorage[asked_key]) {
      return false;

    } else {
      return true;
    }
  },

  // check if user has accepted to allow eye gaze tr
  isAccepted: function() {
    'use strict';
    // if user has accepted before, then open extension.
    var accept = localStorage[accept_key] === '1';

    var accept_state = accept ? "accepted" : "rejected";
    console.log(" User has " + accept_state + " to open extension ");
    return accept;
  },

  // generate warning 
  generateWarning: function(text) {
    'use strict';

    var warning_text = text + '<button id="xa_cancel_button" >Cancel</button>' + '<button id="xa_confirm_button" >Confirm</button>';

    var warning_div = document.createElement('div');
    warning_div.id = 'xa_warning';
    warning_div.innerHTML = '<div class="xa_warning_content"><b>' + warning_text + '</b></div>';
    if (document.getElementsByTagName('body')[0]) {
      document.body.appendChild(warning_div);
    }

    var warning_style = document.createElement('style');
    warning_style.type = 'text/css';
    warning_style.innerHTML = "div#xa_warning {position: absolute; top: 0; left: 0; right: 0; padding: 10px 10px; opacity: 0.85; background-color: #DDEEEE; -webkit-box-shadow: 0 0 5px black; -moz-box-shadow: 0 0 5px black; box-shadow: 0 0 5px black;} .xa_warning_content {width: 100%;  } #xa_confirm_button, #xa_cancel_button { margin-left: 5px; float: right; color: white; font-size: 14px; padding: 5px; border-radius: 4px; text-shadow: 0 1px 1px rgba(0, 0, 0, 0, 0.2) }  #xa_confirm_button { background: rgb(28, 184, 65);} #xa_cancel_button {background: rgb(202, 60, 60);}";
    document.head.appendChild(warning_style);

    // add event listener to cancel button 
    document.getElementById("xa_cancel_button")
      .addEventListener('click', function() {
        PermissionForm.onPermissionReject();
      });

    // add event listener to cancel button 
    document.getElementById("xa_confirm_button")
      .addEventListener('click', function() {
        PermissionForm.onPermissionAccept();
      });

  },

  onPermissionAccept: function() {
    'use strict';

    // remove warning 
    PermissionForm.removeWarning('xa_warning');
    // set asked to true ('1');
    localStorage[asked_key] = '1';

    // set accept value to '1'
    localStorage[accept_key] = '1';
    if (PermissionForm.onAccept != null) {
      PermissionForm.onAccept();
    }
  },

  onPermissionReject: function() {
    'use strict';

    // remove warning 
    PermissionForm.removeWarning('xa_warning');
    // set asked to true ('1');
    localStorage[asked_key] = '1';

    // set accept value to '0'
    localStorage[accept_key] = '0';
    if (PermissionForm.onReject != null) {
      PermissionForm.onReject();
    }
  },

  removeWarning: function(elementID) {
    'use strict';

    var parentElement = document.getElementsByTagName('body')[0];
    var element = document.getElementById(elementID);

    parentElement.removeChild(element);
  }
};

// Tagging for embeddedjs is for retrieving tags that defined in DOM object. 
// Current version: 0.1.0 	Updated by: Litao Shen
// Update Date: 10 Jul 2015


/***********************************************************************/
// > Tagging 
/***********************************************************************/
var Tagging = {
  DEBUG: false,

  attr_xa_track: 'xa_track',
  attr_xa_sub_track: 'xa_sub_track',

  /* 
   * Return element under the coordinate  
   */
  getElement: function(x, y) {
    'use strict';
    return document.elementFromPoint(x, y);
  },

  /* 
   * Return all tags of element including tags in its ancestor  
   */
  retrieveAllTags: function(element) {
    'use strict';

    var tags = [];

    if (element == null) {
      return tags;
    }

    // retrieve tag in element 
    var tag = element.getAttribute(Tagging.attr_xa_track);
    if (tag != null) {

      var sub_tag = element.getAttribute( Tagging.attr_xa_sub_track );

      tags.push({ tag: Tagging.parse(tag), sub_tag: Tagging.parse(sub_tag) });
    }
    // retrieve tags in parents 
    $(element).parents('[' + Tagging.attr_xa_track + ']').each(function() {

      var main_tag = $(this).attr(Tagging.attr_xa_track);
      var sub_tag = $(this).attr( Tagging.attr_xa_sub_track );

      if (main_tag == null) {
        return;
      }

      tags.push({ tag: Tagging.parse(main_tag), sub_tag: Tagging.parse(sub_tag) });
    });

    if (tags.length > 0 && Tagging.DEBUG === true) {
      console.log(tags);
    }

    return tags;
  },

  /* 
   * Return tag in component when it has one, 
   * otherwise, return tag in closest ancestor. 
   * If no tag found, return null.
   */
  retrieveTag: function(element) {
    'use strict';
    if (element === null) {
      return '';
    }

    // find the cloesest element which has Tag 
    var foundElement = $(element).closest('[' + Tagging.attr_xa_track + ']');

    if (Tagging.DEBUG === true) {
      // print out component name 
      console.log(foundElement.attr(Tagging.attr_xa_track));
    }

    return Tagging.parse(element.getAttribute(Tagging.attr_xa_track)) ||
      Tagging.parse(foundElement.attr(Tagging.attr_xa_track));
  },

  /*
   * retrieve name of tag
   * return null when name couldn't be found.
   */
  retrieveTagName: function(tag) {
    'use strict';
    var name_str = tag.match(/^\s*name\s*:\s*\w+\s*/i);
    var name = name_str ? String(name_str).split(":")[1].trim() : null;
    //console.log('Tag name : ' + name);
    return name;
  },

  /*
   * retrieve classes of tag
   * return null when no classes existing 
   */
  retrieveTagClass: function(tag) {
    'use strict';
    var cl_str = tag.match(/classes\s*:\s*[ \w+]*/i);
    var cl = cl_str ? String(cl_str).split(":")[1].trim() : null;
    if (Tagging.DEBUG === true) {
      //console.log(cl_str);
      //console.log(cl);
      console.log("Classes: " + (cl ? cl.split(' ') : null));
    }

    return cl ? cl.split(' ') : null;
  },

  /*
   * validate format of tag 
   */
  isValid: function(tag) {
    'use strict';
    try {
      var validation = tag.search(/^\s*name\s*:\s*\w+\s*;(classes\s*:)*[ \w+]*/i);

      if (validation === -1) {
        throw 'tag "' + tag + '" is in invalid format';
      }
    } catch (err) {
      console.error('Error: ' + err + '.');
      return false;
    }

    return true;
  },

  /**
   * return all repeated tags in sorted list 
   * else return false 
   */
  anyRepeatTag: function() {
    'use strict';
    var tags = Tagging.findAllTags();
    var repeated_tags = [];

    //console.log(tags);

    if (tags == null) {
      return false;
    }

    tags = Tagging.sort_tags(tags);

    for (var i = 0, len = tags.length; i < len; i++) {
      var tag_prev = Tagging.retrieveTagName(tags[i] || '');
      var tag_next = Tagging.retrieveTagName(tags[i + 1] || '');
      if (tag_prev != null && tag_next != null && tag_prev == tag_next && jQuery.inArray(tag_prev, repeated_tags) <= -1) {
        repeated_tags.push(tag_prev);
      }
    };

    return repeated_tags.length > 0 ? repeated_tags : false;

  },

  /*
   * sort all tags by name in alphabetic order
   */
  sort_tags: function(tags) {
    'use strict';
    var tags = tags.sort(function(a, b) {
      return Tagging.retrieveTagName(a) > Tagging.retrieveTagName(b);
    });

    return tags;

  },

  /*
   * detect tags
   * testing code to retrieve and operate on tags 
   */
  findAllTags: function() {
    'use strict';
    var tags = [];

    $(document).find('[' + Tagging.attr_xa_track + ']').each(function() {
      tags.push($(this).attr(Tagging.attr_xa_track));
    });

    return tags;
  },

  /*
   * build json data
   */
  parse: function(tag) {

    'use strict';
    if (tag == null || !Tagging.isValid(tag)) {
      return null;
    }

    var tag_data = {};

    var tag_name = Tagging.retrieveTagName(tag);
    var tag_classes = Tagging.retrieveTagClass(tag);

    tag_data.name = tag_name;
    tag_data.classes = tag_classes;

    return tag_data;
  },
};

// The part of Embedded JS for participants, which used for
// diplaying Term and Conditions.
// Current version: 0.3.1 	Updated by: Litao Shen
// Update Date: 16 July 2015

ROOTURL = "//" + window.location.host;

// the key of cache 
//var web_id = window.location.href;
//var web_info = {};
var asked_key = "asked";
var accept_key = "accept";

var asked = localStorage[asked_key] || '0';
var confirmed;

// interface of xa.js
var xa = {
  set_config: function( server_host, front_end_host ){
    'use strict';

    if(server_host){
      SERVER_HOST = server_host; 
    }

    if( front_end_host ){
      FRONT_END_HOST = front_end_host;
    }

  },
  start: function( xlabs_api_token ) {
    'use strict';

    // set api_token 
    embeddedJS.api_token = xlabs_api_token || '32eMr5NuNzaxqwUs8';

    window.onload = function() {
      if (window.jQuery) {
        //jQuery is loaded  

        // start frontend suuport
        FrontEndSupport.start();
        // load overlay
        xa_overlay.start();

        // check installation of extension
        if (!xa.isExtensionInstalled()) {
          return;
        }
        // open permission form if neccessary
        PermissionForm.openPermissionForm(xa.onPermissionAccept, xa.onPermissionReject);


        // check if permission form has been popup and been accepted
        if (PermissionForm.isAsked() && PermissionForm.isAccepted()) {

          embeddedJS.setup();

          // listen to mouse click events 
          //Mouse.mouseUpCallback = MouseClickListener.onMouseUp;
          MouseClickListener.start();

        }
      } else {
        console.error("jQuery didn't loaded properly.");
        return;
      }
    }

  },


  // permissionfrom api 
  onPermissionAccept: function() {
    'use strict';
    console.log( "Accept click" );
    embeddedJS.setup();
  },

  onPermissionReject: function() {
    'use strict';
  },
  isExtensionInstalled: function() {
    'use strict';
    return PermissionForm.isExtensionInstalled();
  },
};

var xa_overlay = {start : function(){var xa_overlay = document.createElement('div');xa_overlay.innerHTML ='<div id="component-overlay" style="display:none"><div class="xa-view xa-view-first"><div class="xa-mask"><h1 style="color:white">Title</h1><p></p><a href class="xa-btn">Read More</a></div></div></div><style>.xa-view .content,.xa-view .xa-mask,.xa-view h1{display:none}.xa-view{min-width:100%;min-height:100%;float:left;overflow:hidden;position:absolute;text-align:center;cursor:default;background-color:transparent;background-position:15px 5px;background-repeat:no-repeat;background-size:30px 30px}.xa-view h1{text-transform:uppercase;text-align:center;position:relative;font-size:17px;padding:10px;background-color:grey;margin:20px 0 0}.xa-view-first p{font-family:Arial,serif;font-size:12px;position:relative;color:#fff;padding:5px;text-align:center;display:none}.xa-view:hover{background-color:#000}.xa-view-first:hover .xa-mask{background-color:#000;display:block;width:100%;min-height:100%;position:relative;overflow:hidden;opacity:1;z-index:9999}<!---->.xa-view-first:hover h1{display:block;animation:showAll .5s;-moz-animation:showAll .5s;-webkit-animation:showAll .5s;-o-animation:showAll .5s}@keyframes showAll{0%{opacity:0}100%{opacity:1}}@-moz-keyframes showAll{0%{opacity:0}100%{opacity:1}}@-webkit-keyframes showAll{0%{opacity:0}100%{opacity:1}}@-o-keyframes showAll{0%{opacity:0}100%{opacity:1}}<!---->.xa-view-first:hover p{display:block;animation:moveToTop .5s;-moz-animation:moveToTop .5s;-webkit-animation:moveToTop .5s;-o-animation:moveToTop .5s}<!---->.xa-view-first:hover .xa-btn{display:inline-block;animation:moveToTop .5s;-moz-animation:moveToTop .5s;-webkit-animation:moveToTop .5s;-o-animation:moveToTop .5s}@keyframes moveToTop{0%{transform:translateY(100px)}100%{transform:translateY(0)}}@-moz-keyframes moveToTop{0%{transform:translateY(100px)}100%{transform:translateY(0)}}@-webkit-keyframes moveToTop{0%{transform:translateY(100px)}100%{transform:translateY(0)}}@-o-keyframes moveToTop{0%{transform:translateY(100px)}100%{transform:translateY(0)}}.xa-view .xa-btn{display:none;padding:6px 12px;font-size:14px;font-weight:400;line-height:1.42857143;text-align:center;white-space:nowrap;vertical-align:middle;-ms-touch-action:manipulation;touch-action:manipulation;cursor:pointer;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;border:1px solid transparent;border-radius:4px;color:#fff;background-color:#3c8dbc;border-color:#2e6da4;margin-bottom:15px}.xa-view .xa-btn.active.focus,.xa-view .xa-btn.active:focus,.xa-view .xa-btn.focus,.xa-view .xa-btn:active.focus,.xa-view .xa-btn:active:focus,.xa-view .xa-btn:focus{outline:dotted thin;outline:-webkit-focus-ring-color auto 5px;outline-offset:-2px}.xa-view .xa-btn.focus,.xa-view .xa-btn:focus,.xa-view .xa-btn:hover{color:#333;text-decoration:none}</style>';
 document.body.appendChild( xa_overlay );}};
return xa; })();

if (typeof define === 'function' && define.amd) {
  define(function () { return xa; });
} else if( typeof module !== 'undefined' && module != null ) {
  module.exports = xa;
}