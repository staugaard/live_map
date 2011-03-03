/*
  Base Canvas Overlay.
*/

function CanvasOverlay() {
  this.fade = 0;
  this.width = 1024;
  this.height = 600;
};

CanvasOverlay.prototype = new google.maps.OverlayView();

CanvasOverlay.prototype.setOptions = function(options) {
  if (options.fade) {
    this.fade = options.fade;
  };
};

CanvasOverlay.prototype.doFade = function() {
  if (this.fade > 0) {
    var image = this.canvasContext.getImageData(0, 0, this.width, this.height);
    var imageData = image.data;
    var length = imageData.length;
    var value;
    for(var i = 3; i < length; i += 4) {
      value = imageData[i] * (1.0 - this.fade);
      // if (value < 1) {
      //   imageData[i] = 0;
      // } else if (value < 50) {
      //   imageData[i] = value / 2;
      // } else {
        imageData[i] = value;
      // };
    };
    image.data = imageData;
    this.canvasContext.putImageData(image, 0, 0);
  };
};

CanvasOverlay.prototype.fadeLoop = function() {
  var that = this;
  setInterval(function() { that.doFade(); }, 500);
};

CanvasOverlay.prototype.draw = function() {
  var me = this;

  var canvas = this.canvas_;
  if (!canvas) {
    this.width  = this.getMap().getDiv().offsetWidth;
    this.height = this.getMap().getDiv().offsetHeight;
    canvas = document.createElement("canvas");
    canvas.setAttribute("width", this.width + "px");
    canvas.setAttribute("height", this.height + "px");
    canvas.style.position = "absolute";
    // Set the overlay's canvas_ property to this canvas
    this.canvas_ = canvas;
    this.canvasContext = canvas.getContext('2d');
    this.canvasContext.fillStyle = "#FF0000";
    //this.canvasContext.setAlpha(.5);

    var panes = this.getPanes();
    panes.overlayImage.appendChild(canvas);

    if (this.fade > 0) {
      this.fadeLoop();
    };
  };
};

CanvasOverlay.prototype.addDot = function(latitude, longitude) {
  var point = this.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(latitude, longitude));

  if (this.beforeDrawDot) {
    this.beforeDrawDot(point);
  };

  //this.canvasContext.putImageData(imageData,0,0);
  this.drawDot(point);

  if (this.afterDrawDot) {
    this.afterDrawDot(point);
  };
};


/*
  Image Overlay.
*/

function ImageOverlay(map, options) {
  this.setMap(map);
  this.setOptions(options);
  this.dot = document.createElement("img");
  this.dot.setAttribute('src', options.src);
};

ImageOverlay.prototype = new CanvasOverlay();

ImageOverlay.prototype.drawDot = function(point) {
  this.canvasContext.drawImage(this.dot, point.x - 8, point.y - 8);
};


/*
  Heat Map Overlay
*/

function HeatMapOverlay(map, options) {
  this.setMap(map);
  this.setOptions(options);
};
HeatMapOverlay.prototype = new CanvasOverlay();

HeatMapOverlay.prototype.drawDot = function(point) {
  var radius1 = 10;
  var radius2 = 20;
  var rgr = this.canvasContext.createRadialGradient(point.x, point.y, radius1, point.x, point.y, radius2);
  // the center of the radial gradient has .1 alpha value
  rgr.addColorStop(0, 'rgba(0,0,0,0.4)');
  // and it fades out to 0
  rgr.addColorStop(0.9, 'rgba(0,0,0,0)');
  // drawing the gradient
  this.canvasContext.fillStyle = rgr;
  this.canvasContext.fillRect(point.x - radius2, point.y - radius2, 2 * radius2, 2 * radius2);
  this.colorize(point.x - radius2, point.y - radius2, 2 * radius2);
};

HeatMapOverlay.prototype.colorize = function(x,y,x2) {
  var image = this.canvasContext.getImageData(0, 0, this.width, this.height);
  // some performance tweaks
  var imageData = image.data;
  var length = imageData.length;
  // loop thru the area
  var r,g,b,tmp,alpha = 0;
  for(var i = 3; i < length; i += 4) {
    r = 0
    g = 0;
    b = 0;
    tmp = 0;
    // [0] -> r, [1] -> g, [2] -> b, [3] -> alpha
    alpha = imageData[i];

    // coloring depending on the current alpha value
    if(alpha <= 255 && alpha >= 235) {
      tmp = 255 - alpha;
      r   = 255 - tmp;
      g   = tmp * 12;
    } else if(alpha <= 234 && alpha >= 200) {
      tmp = 234 - alpha;
      r   = 255 - (tmp * 8);
      g   = 255;
    } else if(alpha <= 199 && alpha >= 150) {
      tmp = 199 - alpha;
      g   = 255;
      b   = tmp * 5;
    } else if(alpha <= 149 && alpha >= 100) {
      tmp = 149 - alpha;
      g   = 255 - (tmp * 5);
      b   = 255;
    } else {
      b  = 255;
    }
    // we ve started with i=3
    // set the new r, g and b values
    imageData[i-3] = r;
    imageData[i-2] = g;
    imageData[i-1] = b;
  }
  // the rgb data manipulation didn't affect the ImageData object(defined on the top)
  // after the manipulation process we have to set the manipulated data to the ImageData object
  image.data = imageData;
  this.canvasContext.putImageData(image, 0, 0);
};


/*
  Marker Overlay
*/

function MarkerOverlay(map, options) {
  this.map = map;
  this.maxMarkers = options.maxMarkers;
  this.markers = [];
};

MarkerOverlay.prototype.addDot = function(latitude, longitude) {
  var marker = null;
  if (this.maxMarkers && this.markers.length > this.maxMarkers) {
    marker = this.markers.shift();
    marker.setMap(null);
  } else {
    marker = new google.maps.Marker({clickable: false});
  };

  marker.setPosition(new google.maps.LatLng(latitude, longitude));
  marker.setAnimation(google.maps.Animation.DROP);
  marker.setMap(map);

  if (this.maxMarkers) {
    this.markers.push(marker);
  };
};