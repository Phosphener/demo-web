// Tagging for embeddedjs is for retrieving tags that defined in DOM object. 
// Current version: 0.1.0 	Updated by: Litao Shen
// Update Date: 10 Jul 2015


/***********************************************************************/
// > Tagging 
/***********************************************************************/

//var TaggingInterface = {
  //getElement : function(x, y){},
  //retrieveAllTags : function(element){},
  //isValid : function(tag){},
  //anyRepeatTag : function(){}
//};

//var TestTagging = function(){

//};

//TestTagging.prototype = Object.create( TaggingInterface );
//TestTagging.prototype.getElement = function(x, y){
  //'use strict';
  //return document.elementFromPoint(x, y);
/*};*/

var Tagging = {
  attributeName: 'xa_track',

  /* 
   * Return element under the coordinate  
   */
  getElement: function(x, y) {
    'use strict';
    return document.elementFromPoint(x, y);
  },

  /* 
   * Return all tags of element including tags in its accestor  
   */
  retrieveAllTags: function(element) {
    'use strict';

    var tags = [];

    if (element == null) {
      return '';
    }

    // retrieve tag in element 
    var tag = element.getAttribute(Tagging.attributeName);
    if (tag != null) {
      tags.push(Tagging.build_data(tag));
    }
    // retrieve tags in parents 
    $(element).parents('[' + Tagging.attributeName + ']').each(function() {

      var tag = $(this).attr(Tagging.attributeName);

      if (tag == null) {
        return;
      }

      tags.push(Tagging.build_data(tag));
    });

    console.log( tags );

    return tags;
  },

  /* 
   * Return tag in component when it has one, 
   * otherwise, return tag in closest accestor. 
   * If no tag found, return null.
   */
  retrieveTag: function(element) {
    'use strict';
    if (element === null) {
      return '';
    }

    // find the cloesest element which has Tag 
    var foundElement = $(element).closest('[' + Tagging.attributeName + ']');
    // print out component name 
    console.log(foundElement.attr(Tagging.attributeName));

    return element.getAttribute(Tagging.attributeName) || foundElement.attr(Tagging.attributeName);
  },

  /*
   * retrieve name of tag
   * return null when name couldn't be found.
   */
  retrieveTagName: function(tag) {
    'use strict';
    var name_str = tag.match(/^name:\s*\w+/i);
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
    var cl_str = tag.match(/class:\s*[ \w+]*/i);
    //console.log(cl_str);
    var cl = cl_str ? String(cl_str).split(":")[1].trim() : null;
    //console.log(cl);
    console.log("Classes: " + (cl ? cl.split(' ') : null));

    return cl ? cl.split(' ') : null;
  },

  /*
   * validate format of tag 
   */
  isValid: function(tag) {
    'use strict';
    try {
      var validation = tag.search(/^name:\s*\w+[;]+(class:)*[ \w+]*/i);

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
    console.log(tags);
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

    $(document).find('[' + Tagging.attributeName + ']').each(function() {
      tags.push($(this).attr(Tagging.attributeName));
    });

    return tags;
  },

  build_data: function(tag) {

    'use strict';
    if (tag == null || ! Tagging.isValid( tag )) {
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


