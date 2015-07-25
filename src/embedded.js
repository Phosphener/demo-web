// The Embedded JS for participants.
// Current version: 0.4.8 	Updated by: Xun Guo
// Update Date: 27 May 2015

// Debug mode.
var DEBUG = false;
var SERVER_HOST = "http://localhost:3000"

var embeddedJS = {
  // Variables
  sdk_config : null,  	// JSON data object.
  data_array : [],  // Data array for sending.
  data_counter : 100,   // When data counter >= 1, add JSON data to array.
  // data_counter : 10,   // For test mock up REST API.
  domain : null,    // Domain name of the current website.
  url : null,   // URL of the current page.
  session_key : null,   // The session id for current session.
  
  start : function() {
    // Set xLabs extension to "learning" mode to start calibration.
    xLabs.setConfig( "system.mode", "learning" );
    xLabs.setConfig( "browser.canvas.paintLearning", "0" );
    
    // Get current domain name and url.
    embeddedJS.domain = document.domain;
    embeddedJS.url = window.location.href;
    
    // Get current session id from server side.
    $.ajax({
      url : SERVER_HOST + "/key",
      type : "GET",
      crossDomain: true
    })
    .done(function (data) {
      embeddedJS.session_key = data.session_key;
      console.log(embeddedJS.session_key);
    })
    .fail(function () { console.log("Error"); });
  },
  
  update : function () {
    var trackSuspended = parseInt(xLabs.getConfig("state.trackingSuspended"));
    var calibrationStatus = parseInt(xLabs.getConfig("calibration.status"));
    
    // If not calibrated or tracking suspended, do not send data.
    if((xLabs.config === null) || 
       // (calibrationStatus === 0) ||
       (trackSuspended == 1)) {
      //console.log( "cs: "+calibrationStatus + " ts="+trackingSuspended );
      return;
    }
    
    // The whole JSON object, append domain name and URL to the object.
    embeddedJS.sdk_config = xLabs.config;
    var element = 
      document.elementFromPoint(embeddedJS.sdk_config.state.gaze.measured.x, 
                                embeddedJS.sdk_config.state.gaze.measured.y);
    if (element !== null) {
      embeddedJS.sdk_config.element = element.id;
      // embeddedJS.sdk_config.element = element.tagName;
    } else {
      embeddedJS.sdk_config.element = "Nil";
    }
    
    // Build JSON object based on data model.
    // embeddedJS.sdk_config = embeddedJS.build_json(xLabs.config);
    
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
  build_json : function (config) {
    var dataObj = {};
    var gazeObj = {};
    
    if (config === null) {
      return;
    }
    
    // Timestamp of the data.
    dataObj.timestamp = config.state.timestamp;
    
    // Calibration status of the data.
    // 0 is in calibration mode; 1 is normal data.
    dataObj.calibrationStatus = config.calibration.status;
    
    // Confidence value. <= 6 is confidence data.
    dataObj.confidence = config.state.calibration.confidence;
    
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
      dataObj.element = element.id;
      // dataObj.element = element.tagName;
    } else {
      dataObj.element = "Nil";
    }

    return dataObj;
  },
  
  // Packing and compress the data object into an array.
  packingData : function () {
    // Push data object to array if count > 0.
    if (embeddedJS.data_counter > 0) {
      embeddedJS.data_array.push(embeddedJS.sdk_config);
      embeddedJS.data_counter--;
      console.log("counter: " + embeddedJS.data_counter);
      if (embeddedJS.data_counter > 0) {
        return;
      }
    }

    // When collected 100 data object, compress it.
    var array_json = {};
    array_json.config = embeddedJS.data_array;
    var compressedData = embeddedJS.compressData(array_json);
    
    // Display compression rate when on debug mode.
    if (DEBUG) {
      // For single JSON object.
      // embeddedJS.showCompressionRate(embeddedJS.sdk_config);
      // For the JSON data array.
      embeddedJS.showCompressionRate(array_json);
      // Only display once.
      DEBUG = false;
    }
    
    return compressedData;
  },
  
  // Compress data.
  compressData : function (json_obj) {   
    var compressedData = 
        LZString.compressToEncodedURIComponent(JSON.stringify(json_obj));
    
    return compressedData;
  },
  
  // Decompress data.
  decompressData : function (compressedData) {
    var decompressed = 
        LZString.decompressFromEncodedURIComponent(compressedData);
    // console.log("Decompressed: " + decompressed);
    
    return decompressed;
  },
  
  // Display compression rate on the page.
  showCompressionRate : function (originData) {
    var span = document.createElement("span");
    var br = document.createElement("br");
    
    console.time("compression");
    var compressedData = embeddedJS.compressData( originData );
    console.timeEnd("compression");

    console.time("decompression");
    var decompressedObj = 
      JSON.stringify ( JSON.parse(embeddedJS.decompressData(compressedData)) );
    console.timeEnd("decompression");

    var compressionRate = 
      (sizeof(compressedData) / sizeof( JSON.stringify(originData) )) * 100;
    
    var textMsg = 
      document.createTextNode(
        "Size of Json object: " + sizeof( originData ) +
        " Size before compress: " + sizeof( JSON.stringify(originData) ) +
          " Compressed size: " + sizeof(compressedData) +
        " Decompressed size: " + sizeof(decompressedObj) +
        " Compression rate: " + compressionRate.toFixed(2) + "%");
    
    span.appendChild(textMsg);
    span.appendChild(br);
    document.body.appendChild(span);
  },
  
  // Send compressed data, domain name, url and session id to server
  sendData : function (compressedData) {
    // console.log("Compressed length: " + compressedData.length);
    
    var data = {};
    data.data = compressedData;
    data.domain = embeddedJS.domain;
    data.url = embeddedJS.url;
    // Append cookie as session id.
    data.session_key = embeddedJS.session_key;
    
    // Post JSON object to server to RESTful API.
    $.ajax({
        url : SERVER_HOST + "/data",
        datatype : "json",
        contentType : "application/json; charset=utf-8",
        processData : false,
        type : "POST",
        crossDomain: true,
        data : JSON.stringify(data)
    })
    .done(function(data) { console.log("Success!"); })
    .fail(function()  { console.log("Error"); });
  },
  
  // xLabs API
  onXlabsReady : function() {
    // Clear calibration data and memory buffer.
    xLabs.setConfig( "calibration.clear", "1" );
  },
  
  onXlabsState : function() {
  },
  
  setup : function() {
    // Set xLabs extension to "off" mode before user accepted the T's & C's.
    window.addEventListener( "beforeunload", function() {
        xLabs.setConfig( "system.mode", "off" );
    });
    
    // Update Embedded JS status every 25 milisecond.
    var updateInterval = 25;
    setInterval(embeddedJS.update, updateInterval);
    
    embeddedJS.start();
    
    xLabs.setup(embeddedJS.onXlabsReady, embeddedJS.onXlabsState);
  },
};

// embeddedJS.setup();
