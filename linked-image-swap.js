/**
 * @todo: cope with no default image input?
 */

/**
 * LinkedImageSwap module
 * Buttons show associate images
 *
 * @param {jQuery} $
 */

H5P.LinkedImageSwap = (function ($) {
  /**
   * Initialize a new LinkedImageSwap
   * 
   * @class H5P.LinkedImageSwap 
   */
  function LinkedImageSwap(params, contentId) { //}, contentData) {
    // Keep provided id.
    this.contentId = contentId;
    
    // Extend defaults with provided options
    this.params = $.extend({}, {
      defaultImage: '', 
      linkedImages: []
    }, params);

    this.linkedImagePaths = [];
    this.linkedImageAlts = [];
    this.linkButtons = [];

    // Lisetening for changes to size so can change layout when resized
    this.on('resize', function () {
      this.checkAndAdjustLayout(43,235);  //specify width:font size ratio and max width of column for bttons in widescreen mode 
    });

    this.currentImageId; //used to prevent actions when slected button is clicked again

  };

  LinkedImageSwap.prototype = Object.create(H5P.EventDispatcher.prototype);
  LinkedImageSwap.prototype.constructor = LinkedImageSwap;
 
  /**
   * Attach function called by H5P framework to insert H5P content into
   * page
   *
   * @param {jQuery} $container
   */
  LinkedImageSwap.prototype.attach = function ($container) {
    var self = this;
    // Set class on container to identify it as a linked image swap container.  Allows for styling later.
    $container.addClass("h5p-linkedimageswap-container");

    //creating wrapper on which to listen for resize events after: https://h5p.org/documentation/for-developers/responsive-design
    if (self.$wrapper === undefined) {
      // Create our wrapper on first attach.
      self.$wrapper = $('<div/>');
    }

    // Attach wrapper to container.
    $container.html('').append(self.$wrapper);

    //then add list
    self.$linkListContainer = $('<div>',{
      class: 'h5p-linkedimageswap-options-container',
    });
    self.$wrapper.append(self.$linkListContainer);
    self.$linkList = $('<ul>',{
      class: 'h5p-linkedimageswap-options',
      role: 'radiogroup'
    });
    self.$linkListContainer.append(self.$linkList);

    //now add image container and default image
    self.linkedImagePaths[0] = H5P.getPath(self.params.defaultImage.path, self.contentId);
    if(typeof self.params.defaultAltText !== 'undefined') {
      self.linkedImageAlts[0] = self.params.defaultAltText;
    } else {
      self.linkedImageAlts[0] = '';
    }
    
    //create img and populate with default image
    self.$imageElement = $('<img>',{
      class: 'h5p-linkedimageswap-image',
      src: self.linkedImagePaths[0],
      id: 'linkedImage',
      name: 'linkedImage',
      alt: self.linkedImageAlts[0],
      tabindex: '0'
    });

    //adding containing div and image
    self.$imageContainer = $('<div>')
      .addClass('h5p-linkedimageswap')
      .append(self.$imageElement);
    self.$wrapper.append(self.$imageContainer);

    //create default button
    self.createLinkButton(0, 'Default');
    self.linkButtons[0].focus();
    
    //read aparms into arrays, omitting those where either the linkText or linkedImage are missing
    var createdButtonsCounter = 1; //to cope with images/buttons potentially not being added below
    for (var i = 0; i < self.params.linkedImages.length; i++) {
      if(self.params.linkedImages[i].linkedImage !== 'undefined' && self.params.linkedImages[i].linkedImage) {
        self.linkedImagePaths[createdButtonsCounter] = H5P.getPath(self.params.linkedImages[i].linkedImage.path, self.contentId);
        if(typeof self.params.linkedImages[i].altText !== 'undefined') {
          self.linkedImageAlts[createdButtonsCounter] = self.params.linkedImages[i].altText;
        } else {
          self.linkedImageAlts[createdButtonsCounter] = '';
        }
        self.createLinkButton(createdButtonsCounter, self.params.linkedImages[i].linkText);
        createdButtonsCounter++;
      }
    }  
    self.widestLink = self.getWidthOfWidestLink(); //only need to run this at start up
  };

  /**
   * Create HTML for link button and event handlers.
   * @param {number} id - index of linkText and linkedImage
   * @param {string} linkText
   */
  LinkedImageSwap.prototype.createLinkButton = function (id, linkText) {
    var self = this;
    var linkButtonId = 'h5p-linkedimageswap-link-button' + this.idPrefix + id;
    // Create list item radio button
    var $linkButton =  $('<li/>', {
        'id': linkButtonId,
        'role': 'radio',
        'tabindex': (id === 0 ? '0':'-1'),
        'aria-selected': (id === 0 ? 'true' : 'false'),
        'aria-checked': (id === 0 ? 'true' : 'false'),
        'html': '<div class="outer-circle"><div class="inner-circle"></div></div><p>' + linkText + '</p>',
      });
      //now let's add some event handlers to our button
      $linkButton.on('click', function(){
        self.swapImage(id);
      })
      $linkButton.on('keydown', function(event){
        switch (event.keyCode) {
          case 38:   // Up
          case 37: { // Left
            if(id > 0) {
              self.swapImage(id - 1);
            } else {
              self.swapImage(self.linkedImagePaths.length-1);
            }
            return false;
          }
          case 40:   // Down
          case 39: { // Right
            if(id < self.linkedImagePaths.length - 1) {
              self.swapImage(id + 1);
            } else {
              self.swapImage(0);
            }
            return false;
            }
          case 32:   // SPACE
          case 13: { // ENTER
            self.swapImage(id);
            return false;
          }
        }
      })
      $('.h5p-linkedimageswap-options').append($linkButton);
      self.linkButtons.push($linkButton);
  }

  /**
   * Show image associated with id button
   * @param {number} id - index of linkText and linkedImage
   */
  LinkedImageSwap.prototype.swapImage = function(id) {
    var self = this;
    if(id !== self.currentImageId) {  //ie don't do anything unless changed
      $('#linkedImage').attr('src', self.linkedImagePaths[id]);
      $('#linkedImage').attr('alt', self.linkedImageAlts[id]);
      self.currentImageId = id;
      self.doSelecting(id);
    }
  }

  /**
   * Update attributes of selected (id) and other buttons
   * @param {number} id - index of linkText and linkedImage
   */
  LinkedImageSwap.prototype.doSelecting = function(id) {
    var self = this;
    for (var i = 0; i < self.linkButtons.length; i++) {
      if (i !== id) {
        self.linkButtons[i].attr('aria-checked', false); 
        self.linkButtons[i].attr('aria-selected', false);  
        self.linkButtons[i].attr('tabindex', -1);
      } else {
        self.linkButtons[i].attr('aria-checked', true);
        self.linkButtons[i].attr('aria-selected', true);  
        self.linkButtons[i].attr('tabindex', 0);  
        self.linkButtons[i].focus(); 
      }
    }
  }

  /**
   * Check and update layout if necessary - see: https://h5p.org/documentation/for-developers/responsive-design
   * @param {number} widthFontSizeRatio
   * @param {number} maxButtonColumnWidth
   */
  LinkedImageSwap.prototype.checkAndAdjustLayout = function(widthFontSizeRatio, maxButtonColumnWidth) {
    var self = this;
    //Find ratio of width to em, and make sure it is less than the predefined ratio.
    if ((self.widestLink && self.$wrapper.width() / parseFloat($("body").css("font-size")) > widthFontSizeRatio) && (self.widestLink < maxButtonColumnWidth)) {
      self.$linkList.addClass('h5p-linkedimageswap-options-widescreen');
      self.$linkList.css({'width': self.widestLink});
      //new width
      var newWidth = parseFloat(self.$wrapper.css('width')) - self.widestLink;
      self.$imageContainer.css({'width': newWidth});
      self.$imageContainer.css({'float': 'right'});
    }
    else {
      // Remove the specific wide screen settings.
      self.$imageElement.css({'margin-left': 0});
      self.$linkList.removeClass('h5p-linkedimageswap-options-widescreen');
      self.$linkList.css({'width': 'auto'});
      self.$imageContainer.css({'width': 'auto'});
      self.$imageContainer.css({'float': 'none'});
    }  
  }

  /**
   * Get width of widest link text - run once as won't change during lifetime
   */
  LinkedImageSwap.prototype.getWidthOfWidestLink = function() {
    var self = this;
    var longestText = 0;
    for (var i = 0; i < self.linkButtons.length; i++) {
      if(self.linkButtons[i].innerWidth() > longestText) {
        longestText = self.linkButtons[i].innerWidth();
      }
    }
    //now need to work out how much width including margins, padding, etc:
    //work out what 1em is as pixels
    var fontSizeinPixels = parseFloat(getComputedStyle(self.$linkList[0]).fontSize);
    var totalWidth = longestText;
    //lh padding on <p> = 1em
    totalWidth = totalWidth + 1 * fontSizeinPixels; 
    //lh & rh padding on li = 1.8
    totalWidth = totalWidth + 1.8 * fontSizeinPixels;
    //lh & rh margin on li = 0.3
    totalWidth = totalWidth + 0.4 * fontSizeinPixels;

    return totalWidth;

  }
 
  return LinkedImageSwap;
})(H5P.jQuery);