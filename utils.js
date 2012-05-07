(function(){
// UTILS

// Handle The Hover Popup
window.hoverPopup = (function () {
  var node = $('<div class="hoverPopup" />').hide().appendTo('body');
  var visible = false;

  return {
    node: function(){ return node },
    visible: function(){ return visible },
    text: function(text){ node.text(text); return this },
    html: function(html){ node.html(html); return this },
    show: function(){ visible=true; node.show(); return this },
    hide: function(){ visible=false; node.hide(); return this },
    position: function (x, y) { node.css('top', y).css('left', x); return this }
  }
}());

$('input[type=range]').each(function(){
  var r = $(this);
  var exp = parseFloat(parseFloat(r.attr("step")).toExponential().split("e")[1]);
  r.on("change mousemove", function(e) {
    hoverPopup.text(parseFloat(r.val()).toFixed(Math.max(0, -exp)));
  });
});

var followPopup = "[data-hoverText], [data-hoverHtml], .followPopup, canvas.light-orientation , input[type=range]";
$(document).on('mousemove', function(e){
  var target = $(e.target);
  var visible = hoverPopup.visible();
  if (target.is(followPopup)) {
    var hoverText = target.attr('data-hoverText');
    if (hoverText) {
      hoverPopup.text(hoverText);
    }
    var hoverHtml = target.attr('data-hoverHtml');
    if (hoverHtml) {
      hoverPopup.html(hoverHtml);
    }
    var x = e.clientX+8;
    var y = e.clientY+16;
    x = Math.min(x, $(window).width()-hoverPopup.node().width() - 20);
    hoverPopup.position(x,y);
    !visible && hoverPopup.show();
  }
  else if (visible) {
    hoverPopup.hide();
  }
})

// get a relative position with and event
function positionWithE (e, node) {
  var rect = node.getBoundingClientRect();          
  return { 
    x: e.pageX - rect.left - window.scrollX,
    y: e.pageY - rect.top - window.scrollY
  };
}
window.positionWithE = positionWithE;

}());
