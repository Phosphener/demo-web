// The part of Embedded JS for participants, which used for
// diplaying Term and Conditions.
// Current version: 0.3.1 	Updated by: Litao Shen
// Update Date: 22 May 2015

// Root url
var ROOTURL = location.origin;
var SERVER_HOST = "http://xlabs.uthoft.com"

// the key of cache 
//var web_id = window.location.href;
//var web_info = {};
var asked_key = "asked";
var accept_key = "accept";

var asked = localStorage[asked_key] || '0';
var confirmed;

// noty form that ge
var noty_id;

// session id in window.localStorage[session_id_key]
var session_id_key = "session_id";

function open_permission_form() {
  'use strict';

  //loadScript('//code.jquery.com/jquery-2.1.4.min.js', "js", function() {
  loadScript('./src/lib/jquery-2.1.4.min.js', "js", function () {
    //loadScript(ROOTURL + '/src/lib/jquery-2.1.4.min.js', "js", function() {

    return $.when(
      // load libraries
      //$.getScript("https://b399c09ffe0ba1a9b89e049b9cf83764e81773d2.googledrive.com/host/0Bzoa7gPAZkDvflJfcDEwSmwtWklOYk8yQUtNMlJUWUltRWwwa3pBVXhicFpWTHhOdi1aUFk/sizeof.js"),
      //$.getScript("https://b399c09ffe0ba1a9b89e049b9cf83764e81773d2.googledrive.com/host/0Bzoa7gPAZkDvflJfcDEwSmwtWklOYk8yQUtNMlJUWUltRWwwa3pBVXhicFpWTHhOdi1aUFk/lz-string.js"),
      //$.getScript("https://b399c09ffe0ba1a9b89e049b9cf83764e81773d2.googledrive.com/host/0Bzoa7gPAZkDvflJfcDEwSmwtWklOYk8yQUtNMlJUWUltRWwwa3pBVXhicFpWTHhOdi1aUFk/jquery.noty.packaged.min.js"),
      //$.getScript("https://b399c09ffe0ba1a9b89e049b9cf83764e81773d2.googledrive.com/host/0Bzoa7gPAZkDvflJfcDEwSmwtWklOYk8yQUtNMlJUWUltRWwwa3pBVXhicFpWTHhOdi1aUFk/xlabs.js"),
      //$.getScript("https://b399c09ffe0ba1a9b89e049b9cf83764e81773d2.googledrive.com/host/0Bzoa7gPAZkDvflJfcDEwSmwtWklOYk8yQUtNMlJUWUltRWwwa3pBVXhicFpWTHhOdi1aUFk/embedded.js"),
      $.getScript(ROOTURL + "/src/lib/lz-string.js"),
      $.getScript(ROOTURL + "/src/lib/sizeof.js"),
      $.getScript(ROOTURL + "/src/lib/jquery.noty.packaged.js"),
      $.getScript(ROOTURL + "/src/lib/mouse.js"),
      $.getScript(ROOTURL + "/src/lib/xlabs.js"),
      $.getScript(ROOTURL + "/src/tagging.js"),
      //$.getScript(ROOTURL + "/src/embedded.js"),
      $.Deferred(function (deferred) {
        $(deferred.resolve);
      })
      ).then(function () {
        frontEndSupport();
        parent.window.postMessage("ready", "*");
        
        // check if extension is installed
        var installed = isExtensionInstalled();
        if (!installed) {
          return;
        }

        // check if any repeated tags in one page 
        try {
          var repeated_tags = Tagging.anyRepeatTag();
          if (repeated_tags) {
            throw 'Found repeated tags, please fix them: <' + repeated_tags + '> .';
          }
        } catch (err) {
          console.error(err);
        }

        // check if permission form has been popup and been accepted
        if (isAsked() && isAccepted()) {
          embeddedJS.setup();
        }

        // if not asked, open permission form
        open_permission();

      }).done(function () {
        return {
          form_loaded: true
        };
      });
  });
}

var componentPosition = {};

function frontEndSupport() {
  // This is the temporary implementation of the HTML5 postMessage
  // to enable cross domain communication.
  // This allows the FrontEnd to be informed about the location of
  // the tracking components. (via iframe)
			
  // Listen to the request from the FrontEnd
  window.addEventListener("message", function (event) {
				
    // Check if the message is from front end.
    // FIXME: Remember to fix me in production. 
    if (event.origin.includes("xlabs-admin.uthoft.com")) {
      //handleMessage(event);
    }
    handleMessage(event);
  }, false);
}

function handleMessage(event) {
  var trackedComponents = $('[' + Tagging.attributeName + ']');
  
  if (event.data == 'location') {
      // Return the document?
      var scrollLeft = window.pageXOffset || document.body.scrollLeft || document.documentElement.scrollLeft;
      var scrollTop = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop;

      trackedComponents.each(function (currentIndex, element) {
        var componentName = Tagging.retrieveTagName(Tagging.retrieveTag(element));
        componentPosition[componentName] = {};
        componentPosition[componentName].left = element.getBoundingClientRect().left + scrollLeft;
        componentPosition[componentName].top = element.getBoundingClientRect().top + scrollTop;
        componentPosition[componentName].width = element.getBoundingClientRect().width;
        componentPosition[componentName].height = element.getBoundingClientRect().height;
      });
      console.log(componentPosition);

      var docHeight = $(document).height();

      $("body").append("<div id='xa-overlay'></div>");

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
          
      event.source.postMessage(componentPosition, "*");

    } else {
      console.log(event.data);
      var componentOverview = event.data;

      for (componentName in componentOverview) {
        createOverlay(componentPosition[componentName], componentName, componentOverview[componentName]);
      }
          
      // Register another message handler to add overlay
      // $("body").append(event.data);
          
      $(".xa-view .xa-mask").on('click', 'a', function (e) {
        var name = $(this).attr("data-overlay-name");
        event.source.postMessage(name, "*");
      });
    }
}

function createOverlay(position, name, descriptions) {
  var componentOverlay = document.createElement("div");
  $(componentOverlay).height(position.height);
  $(componentOverlay).width(position.width);
  $(componentOverlay).offset({ top: position.top, left: position.left });
  componentOverlay.style.position = "absolute";
  componentOverlay.style.opacity = "0.8";
  componentOverlay.style.zIndex = 9998;
  componentOverlay.style.display = "block";

  var viewOverlay = $("#component-overlay").clone();
  viewOverlay.find(".xa-mask h1").text(name);

  viewOverlay.find(".xa-mask h1").after(("<p style=\"font-family: \'Arial\'; font-size: 15px; font-style:none;\">" + 'session time' + ": " + descriptions.sessionTime + "</p>"));
  viewOverlay.find(".xa-mask h1").after(("<p style=\"font-family: \'Arial\'; font-size: 15px; font-style:none;\">" + 'fixation number' + ": " + descriptions.fixationNumber + "</p>"));
  viewOverlay.find(".xa-mask a").attr("data-overlay-name", name);

  $(componentOverlay).append(viewOverlay.html());

  $("body").append(componentOverlay);
}

// check installation of extension
function isExtensionInstalled() {

  'use strict';
  var installed = xLabs.extensionVersion();

  console.log(installed ? "Extension is installed." : "Extension is not installed yet.");
  return installed;
}

// open permission fo
function open_permission() {

  'use strict';

  // Confirmed -- let user confirm on conditions 
  confirmed = $.Deferred();

  // after user confirmed options, perform continuing op
  return $.when(confirmed).then(function (accepted) {

    // cache accept variable to browser
    localStorage[asked_key] = '1';
    localStorage[accept_key] = accepted ? '1' : '0';

    // if user click "Ok", open extension then.
    if (accepted) {
      embeddedJS.setup();
    }
    console.log("User's choice : " + accepted);

    // return a message of whether accepted
    return {
      accept: accepted
    };
  });
}

// check whether permission form being popup
function isAsked() {

  'use strict';

  if (asked === '0') {

    var text =
      'Do you want to continue with Eye Gaze Tracking? <br> <a href=".">Term & Conditions</a>';
    var n = generate(text, 'topCenter');
    var noty_id = n.options.id;
    console.log('html: ' + noty_id);

    return false;

  } else {
    return true;
  }
}

// check if user has accepted to allow eye gaze tr
function isAccepted() {
  'use strict';
  // if user has accepted before, then open extension.
  var accept = localStorage[accept_key] === '1';
  var accept_state = accept ? "accepted" : "rejected";
  console.log(" User has " + accept_state + " to open extension ");
  return accept;
}

// generate noty 
function generate(text, layout, confirmCallback, cancelCallback) {
  "use strict";
  return noty({
    text: text,
    type: 'alert',
    dismissQueue: true,
    layout: layout,
    theme: 'defaultTheme',
    modal: true,
    closeWith: ['click'],
    buttons: [{
      addClass: 'btn btn-primary',
      text: 'Ok',
      onClick: function ($noty) {
        confirmed.resolve(true);
        $noty.close();
      }
    }, {
        addClass: 'btn btn-danger',
        text: 'Cancel',
        onClick: function ($noty) {
          confirmed.resolve(false);
          $noty.close();

        }
      }]
  });
}

function loadScript(filename, filetype, callback) {

  'use strict';

  var fileref;
  //script.src = './lib/jquery-2.1.4.min.js';
  if (filetype == "js") { //if filename is a external JavaScript file

    fileref = document.createElement('script');
    fileref.setAttribute("type", "text/javascript");
    fileref.setAttribute("src", filename);

  } else if (filetype == "css") { //if filename is an external CSS file

    fileref = document.createElement("link");
    fileref.setAttribute("rel", "stylesheet");
    fileref.setAttribute("type", "text/css");
    fileref.setAttribute("href", filename);

  }
  if (typeof fileref != "undefined") {
    document.getElementsByTagName("head")[0].appendChild(fileref);
  }

  if (fileref.readyState) {
    fileref.onreadystatechange = function () {
      if (fileref.readyState == "loaded" ||
        fileref.readyState == "complete") {
        fileref.onreadystatechange = null;
        callback();
      }
    };
  } else { //Others
    fileref.onload = function () {
      callback();
    };
  }
}

// interface of xa.js
var xa = {
  open_permission_form: function () {
    'use strict';
    open_permission_form();
  },

  isExtensionInstalled: function () {
    'use strict';
    return isExtensionInstalled();
  },
};

/***********************************************************************/
// > Mouse click events 
/***********************************************************************/
var MouseClickListener = {

  MouseClickRoute: SERVER_HOST,

  /*
   * Listen to mouse click events and send data back 
   */
  onMouseUp: function () {
    'use strict';
    var x = Mouse.xMouseScreen;
    var y = Mouse.yMouseScreen;

    console.log("click@screen " + x + "," + y);
    var doc = xLabs.scr2doc(x, y);
    console.log("click@ " + doc.x + "," + doc.y);

    var data = MouseClickListener.build_json(xLabs.config, doc);
    // send data to server
    MouseClickListener.sendData(data);
  },

  sendData: function (data) {
    'use strict';
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
      .done(function (data) {
        console.log("Success!");
      })
      .fail(function () {
        console.log("Error");
      });
  },

  build_json: function (config, mouseData) {
    'use strict';
    var dataObj = {};

    if (config === null) {
      return;
    }

    // Get current domain name and url.
    dataObj.domain = document.domain;
    dataObj.url = window.location.href;

    // Timestamp of the data.
    dataObj.timestamp = config.state.timestamp;

    // Browser parameters. (document parameters seems useless now)
    dataObj.browser_screen = config.browser.screen;
    // dataObj.browser_doc = config.browser.document;

    // Get element id or tag from the coordinates if element exists.
    var element = Tagging.getElement(mouseData.x, mouseData.y);
    //dataObj.componentName = Tagging.retrieveTag(element);

    dataObj.tags = Tagging.retrieveAllTags(element);

    //console.log(dataObj.tags[0]);
    return dataObj;
  },

}

/***********************************************************************/
// > Module that collecting data 
/***********************************************************************/

// The Embedded JS for participants.
// Current version: 0.4.8 	Updated by: Xun Guo
// Update Date: 27 May 2015

// Debug mode.
var DEBUG = false;

var embeddedJS = {

  // Variables
  sdk_config: null, // JSON data object.
  data_array: [], // Data array for sending.
  data_counter: 100, // When data counter >= 1, add JSON data to array.
  // data_counter : 10,   // For test mock up REST API.
  domain: null, // Domain name of the current website.
  url: null, // URL of the current page.
  session_key: null, // The session id for current session.

  start: function () {
    'use strict';
    // Set xLabs extension to "learning" mode to start calibration.
    xLabs.setConfig("system.mode", "learning");
    xLabs.setConfig("browser.canvas.paintLearning", "0");

    // Get current domain name and url.
    embeddedJS.domain = document.domain;
    embeddedJS.url = window.location.href;

    // Get current session id from server side
    // when there is no session_id in localStorage
    if (!window.localStorage[session_id_key]) {
      $.ajax({
        url: SERVER_HOST + "/key",
        type: "GET",
        crossDomain: true
      })
        .done(function (data) {
          // store session id to localStorage;
          window.localStorage[session_id_key] = data.session_key;
          embeddedJS.session_key = window.localStorage[session_id_key];
          console.log(data.session_key);
        })
        .fail(function () {
          console.log("Error");
        });
    }
    // get session id from localStorage
    embeddedJS.session_key = window.localStorage[session_id_key];
    console.log(embeddedJS.session_key);
  },

  update: function () {
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
   // embeddedJS.sdk_config = xLabs.config;

    // get Tag (component) name of element 
    // var element = Tagging.getElement(embeddedJS.sdk_config.state.gaze.measured.x,
      // embeddedJS.sdk_config.state.gaze.measured.y);
    //embeddedJS.sdk_config.element = Tagging.retrieveTag(element);
    // embeddedJS.sdk_config.tags = Tagging.retrieveAllTags(element);

    // Build JSON object based on data model.
    embeddedJS.sdk_config = embeddedJS.build_json(xLabs.config);

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

    if (config === null) {
      return;
    }

    // Timestamp of the data.
    dataObj.data_timestamp = config.state.timestamp;

    // Calibration status of the data.
    // 0 is in calibration mode; 1 is normal data.
    // dataObj.calibrationStatus = config.calibration.status;

    // Confidence value. <= 6 is confidence data.
    // dataObj.confidence = config.state.calibration.confidence;

    // Current gaze coordinate data.
    // dataObj.gaze = config.state.gaze;
    gazeObj.x = xLabs.scr2docX(config.state.gaze.measured.x);
    gazeObj.y = xLabs.scr2docY(config.state.gaze.measured.y);
    // gazeObj.x = config.state.gaze.measured.x;
    // gazeObj.y = config.state.gaze.measured.y;
    dataObj.gaze = gazeObj;

    // Browser parameters. (document parameters seems useless now)
    dataObj.browser_screen = config.browser.screen;
    // dataObj.browser_doc = config.browser.document;

    // get Tag (component) name of element 
    var element = Tagging.getElement(config.state.gaze.measured.x,
      config.state.gaze.measured.y);
    //embeddedJS.sdk_config.element = Tagging.retrieveTag(element);
    dataObj.component = Tagging.retrieveAllTags(element);
    
    // Website id, url and session_key
    dataObj.url = embeddedJS.url;
    dataObj.session_key = embeddedJS.session_key;

    return dataObj;
  },

  // Packing and compress the data object into an array.
  packingData: function () {
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
  compressData: function (json_obj) {
    'use strict';
    var compressedData =
      LZString.compressToEncodedURIComponent(JSON.stringify(json_obj));

    return compressedData;
  },

  // Decompress data.
  decompressData: function (compressedData) {
    'use strict';
    var decompressed =
      LZString.decompressFromEncodedURIComponent(compressedData);
    // console.log("Decompressed: " + decompressed);

    return decompressed;
  },

  // Display compression rate on the page.
  showCompressionRate: function (originData) {
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
  sendData: function (compressedData) {
    // console.log("Compressed length: " + compressedData.length);

    'use strict';
    var data = {};
    data.data = compressedData;
    data.domain = embeddedJS.domain;
    data.url = embeddedJS.url;
    // Append cookie as session id.
    data.session_key = embeddedJS.session_key;

    // Post JSON object to server to RESTful API.
    $.ajax({
      url: SERVER_HOST + "/data",
      datatype: "json",
      contentType: "application/json; charset=utf-8",
      processData: false,
      type: "POST",
      crossDomain: true,
      data: JSON.stringify(data)
    })
      .done(function (data) {
        console.log("Success!");
      })
      .fail(function () {
        console.log("Error");
      });
  },

  // xLabs API
  onXlabsReady: function () {
    'use strict';
    // Clear calibration data and memory buffer.
    xLabs.setConfig("calibration.clear", "1");
  },

  onXlabsState: function () { },

  setup: function () {
    'use strict';
    // Set xLabs extension to "off" mode before user accepted the T's & C's.
    window.addEventListener("beforeunload", function () {
      xLabs.setConfig("system.mode", "off");
    });

    // Update Embedded JS status every 25 milisecond.
    var updateInterval = 25;
    setInterval(embeddedJS.update, updateInterval);

    // listen to mouse click events 
    Mouse.mouseUpCallback = MouseClickListener.onMouseUp;

    embeddedJS.start();

    xLabs.setup(embeddedJS.onXlabsReady, embeddedJS.onXlabsState);
  },
};

// embeddedJS.setup();

// For integration test.
if (typeof exports !== 'undefined') {
  exports.embeddedJS = embeddedJS;
}
