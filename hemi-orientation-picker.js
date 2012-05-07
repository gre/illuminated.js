jQuery.fn.hemiOrientationPicker = function($color){
  var canvas = $(this);
  canvas.attr('data-angle', 0);
  canvas.attr('data-roughness', 0);

  var ctx = canvas[0].getContext('2d');

  var size = canvas[0].width;
  var demi = Math.round(size/2);
  var down = false;

  var center = { x: demi, y: demi };

  function getColor() {
    return $color.attr("value") || 'rgba(255,255,255,1)';
  }

  var dirty;

  $color.change(function(){
    dirty = true;
  });

  function render () {
    if (!dirty) return; dirty = false;
    ctx.clearRect(0, 0, size, size);
    var g = ctx.createRadialGradient(center.x, center.y, 0, demi, demi, demi );
    var c = getColor();
    g.addColorStop( 0, c);
    g.addColorStop( 1, illuminated.getRGBA(c, 0) );
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }

  requestAnimFrame(function loop() {
    requestAnimFrame(loop, canvas[0]);
    render();
  }, canvas[0]);

  $(window).on("mousedown", function() {
    down = true;
  });
  $(window).on("mouseup", function() {
    down = false;
  });
  canvas.on("change", function(e, d) {
    if (d) {
      canvas.attr('data-angle', d.angle).attr('data-roughness', d.roughness);
      center = {
        x: (-Math.cos(d.angle)*d.roughness+1)*demi,
        y: (Math.sin(d.angle)*d.roughness+1)*demi
      };
      dirty = true;
    }
  });
  canvas.on("mousemove", function(e) {
    var angle, roughness;
    if (down) {
      e.preventDefault();
      var p = positionWithE(e, canvas[0]);
      var x = demi-p.x;
      var y = demi-p.y;
      angle = Math.atan2(-y, x);
      roughness = Math.min(0.99, Math.sqrt(x*x+y*y)/demi);

      canvas.trigger("change", { angle: angle, roughness: roughness });
    }
    else {
      angle = parseFloat(canvas.attr('data-angle'));
      roughness = parseFloat(canvas.attr('data-roughness'));
    }
    hoverPopup.html("angle: "+Math.round(180*angle/Math.PI)+"°<br/>rough: "+roughness.toFixed(2));
  });

  dirty = true;

  return $(this);
}
