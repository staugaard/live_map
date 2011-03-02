/*
  Base Canvas Overlay.
*/

function CanvasOverlay() {
};

CanvasOverlay.prototype = new google.maps.OverlayView();

CanvasOverlay.prototype.draw = function() {
  var me = this;

  var canvas = this.canvas_;
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.setAttribute("width", "1024px");
    canvas.setAttribute("height", "600px");
    canvas.style.position = "absolute";
    // Set the overlay's canvas_ property to this canvas
    this.canvas_ = canvas;
    this.canvasContext = canvas.getContext('2d');
    this.canvasContext.fillStyle = "#FF0000";
    //this.canvasContext.setAlpha(.5);

    var panes = this.getPanes();
    panes.overlayImage.appendChild(canvas);
  };
};

CanvasOverlay.prototype.addDot = function(longitude, latitude) {
  var point = this.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(longitude, latitude));

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

function ImageOverlay(map, image_src) {
  this.setMap(map);
  this.dot = document.createElement("img");
  this.dot.setAttribute('src', image_src);
};

ImageOverlay.prototype = new CanvasOverlay();

ImageOverlay.prototype.beforeDrawDot = function(point) {
  var image = this.canvasContext.getImageData(0, 0, 1024, 600);
  var imageData = image.data;
  var length = imageData.length;
  for(var i = 3; i < length; i += 4) {
    imageData[i] = imageData[i] * 0.95;
  };
  image.data = imageData;
  this.canvasContext.putImageData(image, 0, 0);
};

ImageOverlay.prototype.drawDot = function(point) {
  this.canvasContext.drawImage(this.dot, point.x - 8, point.y - 8);
};
