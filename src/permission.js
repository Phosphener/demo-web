// The part of Embedded JS for participants, which used for
// diplaying Term and Conditions.
// Current version: 0.3.1 	Updated by: Litao Shen
// Update Date: 22 May 2015

// Root url
ROOTURL = "//localhost:8080";

// the key of cache 
//var web_id = window.location.href;
//var web_info = {};
var asked_key = "asked";
var accept_key = "accept";

var asked = localStorage[asked_key] || '0';
var confirmed;

// noty form that ge
var noty_id;


function open_permission_form() {
  loadScript('//code.jquery.com/jquery-2.1.4.min.js', "js", function() {
  //loadScript(ROOTURL + '/src/lib/jquery-2.1.4.min.js', "js", function() {

    loadScript('//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css', "css", function() {

      // Confirmed
      confirmed = $.Deferred();

      return $.when(
        // load libraries
        $.getScript("https://b399c09ffe0ba1a9b89e049b9cf83764e81773d2.googledrive.com/host/0Bzoa7gPAZkDvflJfcDEwSmwtWklOYk8yQUtNMlJUWUltRWwwa3pBVXhicFpWTHhOdi1aUFk/sizeof.js"),
        $.getScript("https://b399c09ffe0ba1a9b89e049b9cf83764e81773d2.googledrive.com/host/0Bzoa7gPAZkDvflJfcDEwSmwtWklOYk8yQUtNMlJUWUltRWwwa3pBVXhicFpWTHhOdi1aUFk/lz-string.js"),
        $.getScript("https://b399c09ffe0ba1a9b89e049b9cf83764e81773d2.googledrive.com/host/0Bzoa7gPAZkDvflJfcDEwSmwtWklOYk8yQUtNMlJUWUltRWwwa3pBVXhicFpWTHhOdi1aUFk/jquery.noty.packaged.min.js"),
        $.getScript("https://b399c09ffe0ba1a9b89e049b9cf83764e81773d2.googledrive.com/host/0Bzoa7gPAZkDvflJfcDEwSmwtWklOYk8yQUtNMlJUWUltRWwwa3pBVXhicFpWTHhOdi1aUFk/xlabs.js"),
        $.getScript("https://b399c09ffe0ba1a9b89e049b9cf83764e81773d2.googledrive.com/host/0Bzoa7gPAZkDvflJfcDEwSmwtWklOYk8yQUtNMlJUWUltRWwwa3pBVXhicFpWTHhOdi1aUFk/embedded.js"),
        //$.getScript(ROOTURL + "/src/lib/lz-string.js"),
        //$.getScript(ROOTURL + "/src/lib/jquery.noty.packaged.js"),
        //$.getScript(ROOTURL + "/src/lib/xlabs.js"),
        //$.getScript(ROOTURL + "/src/embedded.js"),
        $.Deferred(function(deferred) {
          $(deferred.resolve);
        })
      ).then(function() {

        var installed = isInstalled();
        if( ! installed ){
          return; 
        }

        open_permission();
      }).done(function() {
        return {
          form_loaded: true
        };
      });
    });
  });
}

// check installation of extension
function isInstalled() {

  if (! xLabs.extensionVersion()) {

    //var text =
      //'Extension is not installed yet. Would you like to install via <br> <a href="https://chrome.google.com/webstore/detail/xlabs-headeyegaze-tracker/emeeadaoegehllidjmmokeaahobondco">Installation of Extension</a> ?';

    //generate(text, 'top');
    //$.when(confirmed).then(function(install){
      //if( install ){
        //window.open("https://chrome.google.com/webstore/detail/xlabs-headeyegaze-tracker/emeeadaoegehllidjmmokeaahobondco");
      //}
      //console.log("Extension is not installed yet."); 
    /*});*/

    return false;
  }
  return true;
}

// open permission fo
function open_permission() {

  //$(document).ready(function() {

  checkAsked();

  // after user confirmed options, perform continuing op
  return $.when(confirmed).then(function(accepted) {

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
function checkAsked() {

  if (asked === '0') {

    var text =
      'Do you want to continue with Eye Gaze Tracking? <br> <a href=".">Term & Conditions</a>';
    var n = generate(text, 'topCenter');
    var noty_id = n.options.id;
    console.log('html: ' + noty_id);

  } else {
    // if user has accepted before, then open extension.
    var accept = localStorage[accept_key] === '1';
    var accept_state = accept ? "accepted" : "rejected";
    console.log(" User has " + accept_state + " to open extension ");
    if (accept) {
      embeddedJS.setup();
    }
  }

  return {
    asked: asked
  };
}


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
      onClick: function($noty) {
        confirmed.resolve(true);
        $noty.close();
      }
    }, {
      addClass: 'btn btn-danger',
      text: 'Cancel',
      onClick: function($noty) {
        confirmed.resolve(false);
        $noty.close();

      }
    }]
  });
}

function loadScript(filename, filetype, callback) {

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
    fileref.onreadystatechange = function() {
      if (fileref.readyState == "loaded" ||
        fileref.readyState == "complete") {
        fileref.onreadystatechange = null;
        callback();
      }
    };
  } else { //Others
    fileref.onload = function() {
      callback();
    };
  }
}
