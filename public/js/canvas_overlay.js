function CanvasOverlay(map) {
  this.setMap(map);
  this.heart = document.createElement("img");
  this.heart.setAttribute('src', 'heart.png');
}

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
  this.canvasContext.drawImage(this.heart, point.x - 8, point.y - 8);
};
