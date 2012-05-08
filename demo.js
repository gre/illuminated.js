(function(){

var Lamp = illuminated.Lamp
, Light = illuminated.Light
, Vec2 = illuminated.Vec2
, OpaqueObject = illuminated.OpaqueObject
, PolygonObject = illuminated.PolygonObject
, DiscObject = illuminated.DiscObject
, RectangleObject = illuminated.RectangleObject
, Lighting = illuminated.Lighting
, DarkMask = illuminated.DarkMask
;

var supportsColor = $("<input type='color' />")[0].type === "color";

var dirty = true;

var DIST_CLOSE = 10;

var SELECTED_STROKE_FROM = "#115";
var SELECTED_STROKE_TO = "#511";
var HOVER_STROKE = "#667";
var OBJECT_STROKE = "#778";
var SELECTED_STROKE;
setInterval((function(i){
  return function(){
    SELECTED_STROKE = (++i)%2 ? SELECTED_STROKE_FROM: SELECTED_STROKE_TO;
    dirty = true;
  }
}(0)), 300);

var scene;
var mousep = new Vec2();

var mousedown, oldmousedown;
var mousedownItemNew;
var mousedownItem;
var moveItemDelta;

var canvasHashFocus = true;

var buildPoly;
var items = [];
var currentSelect = 0;
var currentToolSelected;

var canvas = document.getElementById("viewport");
var ctx = canvas.getContext("2d");

var $lightorientation = $('canvas.light-orientation');
var $lightcontrols=$(".lightcontrols");
var $objectcontrols=$(".objectcontrols");
var $circlecontrols=$(".circlecontrols");
var $maskcolor = $('input[name=maskcolor]');
var $maskalpha = $('input[name=maskalpha]');
var $lightcolor = $('input[name=lightcolor]');
var $lightalpha = $('input[name=lightalpha]');
var $lightdiffuse = $('input[name=lightdiffuse]');
var $lightsize = $('input[name=lightsize]');
var $lightsamples = $('input[name=lightsamples]');
var $lightdistance = $('input[name=lightdistance]');
var $objectdiffuse = $('input[name=objectdiffuse]');
var $discradius = $('input[name=discradius]');
var $toolbox = $('#toolbox');
var $tools = $toolbox.find("a img");
var $social = $('#social');
var BASE_URL = "http://demo.greweb.fr/illuminated.js";

function init () {
  var obj = {};
  if (location.hash) {
    var hash = location.hash.substring(1);
      try {
        obj = JSON.parse(hash);
        console.log("init from hash");
      }
    catch (e) {
      console.log("init from hash failed. cannot parse ", hash);
    }
  }
  scene = Scene.fromJson(ctx, obj);

  scene.lights.forEach(function(item){
    items.push(item);
  });
  scene.objects.forEach(function(item){
    items.push(item);
  });

  setSelection(null);

  // controls
  $lightorientation.change(function(e, o){
    if (o) {
      scene.setOption("angle", o.angle);
      scene.setOption("roughness", o.roughness);
    }
  }).hemiOrientationPicker($('.light-color'));
}

function createInstanceFor (cl) {
  switch (cl) {
    case "Lamp":
      return getRandomLight();
    case "DiscObject":
      return new DiscObject(new Vec2(), Math.round(30+10*Math.random()));
    case "RectangleObject":
      var dx = 30+Math.round(Math.random()*20);
      var dy = 20+Math.round(Math.random()*10);
      var d = new Vec2(dx, dy);
      return new RectangleObject(new Vec2().sub(d), new Vec2().add(d));
  }
}

function bind () {
  var ext = illuminated.extractColorAndAlpha(scene.getMaskColor());
  $maskcolor.val(ext.color);
  $maskalpha.val(ext.alpha);

  $maskcolor.add($maskalpha).change(function(){
    var color = $maskcolor.val();
    var alpha = Math.round(parseFloat($maskalpha.val())*100)/100;
    scene.setMaskColor( illuminated.getRGBA(color, alpha) );
  });

  $lightcolor.add($lightalpha).change(function(){
    var color = $lightcolor.val();
    var alpha = Math.round(parseFloat($lightalpha.val())*100)/100;
    scene.setOption("color", illuminated.getRGBA(color, alpha) );
  });

  $('.bind-selection input[data-bind-option]').change(function(){
    scene.setOption($(this).attr("data-bind-option"), parseFloat($(this).val()));
  });

  $('.actions button.duplicate').click(function(){
    duplicateSelection();
  });
  $('.actions button.delete').click(function(){
    removeSelection();
  });
  $('.actions button.prev').click(function(){
    prevSelection();
  });
  $('.actions button.next').click(function(){
    nextSelection();
  });

  var title = $("title").text();
  scene.onChange(function () {
    var hash = JSON.stringify(scene.toJson());
    var url = BASE_URL+"/#"+hash;
    $social.attr('addthis:url', url);
    if (window["history"]) {
      history.replaceState({}, title, "#"+hash);
    }
    else {
      location.hash = hash;
    }
    dirty = true;
  });
  scene.triggerChange();

  $('input').live("focus", function() {
    canvasHashFocus = false;
  }).live("blur", function() {
    canvasHashFocus = true;
  });

  window.addEventListener("mousedown", function (e) {
    mousedownItemNew = false;
    oldmousedown = mousedown;
    var p = positionWithE(e, canvas);
    mousedown = p = mousep = new Vec2(p.x, p.y);
    var inBound = p.inBound(new Vec2(0,0), new Vec2(canvas.width, canvas.height));
    var target = $(e.target);
    if (target.is("canvas")) {
      e.preventDefault();
    }
    if (target.is("#toolbox a img")) {
      e.preventDefault();
      var cl = target.attr("data-class");
      selectTool(cl, target);
      var item = createInstanceFor(cl);
      if (item) {
        moveItemDelta = p.inv();
        mousedownItem = item;
        mousedownItemNew = true;
      }
    }
    
    if (inBound) {
      var item = getItemAt(p);
      if (item) {
        e.preventDefault();
        moveItemDelta = new Vec2(0,0);
        mousedownItem = item;
        setSelection(item);
      }
      else {
        if(currentToolSelected=="PolygonObject") {
          e.preventDefault();
          addPolygonPoint(p);
        }
      }
    }
    dirty = true;
  });

  window.addEventListener("mousemove", function (e) {
    var p = positionWithE(e, canvas);
    p = mousep = new Vec2(p.x, p.y);
    var inBound = p.inBound(new Vec2(0,0), new Vec2(canvas.width, canvas.height));
    if (mousedown) {
      if (mousedownItem) {
        if (inBound && items.indexOf(mousedownItem)==-1) {
          if (mousedownItem instanceof Light) {
            items.push(mousedownItem);
            scene.addLight(mousedownItem);
            setSelection(mousedownItem);
          }
          else if (mousedownItem instanceof OpaqueObject) {
            items.push(mousedownItem);
            scene.addObject(mousedownItem);
            setSelection(mousedownItem);
          }
          selectTool(null);
        }
        e.preventDefault();
        var diff = p.sub(mousedown);
        var v = diff.sub(moveItemDelta);
        moveItemDelta = diff;
        move (mousedownItem, v);
      }
    }
    dirty = true;
  });

  window.addEventListener("mouseup", function (e) {
    var p = positionWithE(e, canvas);
    p = new Vec2(p.x, p.y);
    var positionChanged = mousedown && (p.dist2(mousedown) != 0);
    //scene.setOption("position", new Vec2(p.x, p.y));
    var inBound = p.inBound(new Vec2(0,0), new Vec2(canvas.width, canvas.height));
    var item;
    if (inBound) {
      item = getItemAt(p);
      if (!item) {
        if(positionChanged && buildPoly && currentToolSelected=="PolygonObject") {
          e.preventDefault();
          addPolygonPoint(p);
        }
      }
    }
    if (inBound && !positionChanged && !item && !buildPoly) {
      noSelection();
    }
    if (!mousedownItemNew || oldmousedown || positionChanged) {
      mousedown = null;
      mousedownItem = null;
    }
    dirty = true;
  });


  window.addEventListener("keydown", function (e) {
    if (!canvasHashFocus) return;
    switch(String.fromCharCode(e.which).toUpperCase()) {
      case "D":
      e.preventDefault();
      duplicateSelection();
      break;
    }

    switch(e.keyCode) {
      case 27:
        e.preventDefault();
        buildPoly = null;
        setSelection(null);
      break;
      case 8: case 46: // DELETE
        e.preventDefault();
        removeSelection();
      break;
      case 9: // TAB
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if(e.shiftKey) {
          prevSelection();
        }
        else {
          nextSelection();
        }
      }
      break;
    }

    dirty = true;
  });
}

function getSelectionRadiusForLight (l) {
  return Math.max(10, l.radius||0);
}

function getRandomLightColor () {
  var r = Math.round(230+25*Math.random());
  var g = Math.round(180+30*Math.random());
  var b = Math.round(130+20*Math.random());
  var a = 0.7+0.2*Math.random();
  return 'rgba('+[r,g,b,a]+')';
}

function getRandomLight () {
  var size = 2+Math.round(Math.random()*1);
  var samples = 3*size;
  return new illuminated.Lamp(
    new Vec2(),
    Math.round(120+60*Math.random()),
    0.8,
    getRandomLightColor(),
    size,
    samples
  );
}

function syncControls (item) {
  if (!item) {
    $lightcontrols.hide();
    $objectcontrols.hide();
  }
  else if (item instanceof Light) {
    $lightcontrols.show();
    $objectcontrols.hide();
    $lightorientation.trigger("change", {
      angle: item.angle,
      roughness: item.roughness
    });
    var ext = illuminated.extractColorAndAlpha(item.color);
    $lightcolor.val(ext.color);
    if (!supportsColor) {
      $lightcolor.spectrum("set", ext.color);
    }
    $lightalpha.val(ext.alpha);
    $lightdiffuse.val(item.diffuse);
    $lightsize.val(item.radius);
    $lightsamples.val(item.samples);
    $lightdistance.val(item.distance);
  }
  else if (item instanceof OpaqueObject) {
    $lightcontrols.hide();
    $objectcontrols.show();
    $objectdiffuse.val(item.diffuse===undefined ? 0.8 : item.diffuse); //FIXME
    $circlecontrols.hide();
    if (item instanceof DiscObject) {
      $circlecontrols.show();
      $discradius.val(item.radius);
    }
  }
}

function noSelection () {
  setSelection(null);
}

function setSelection (item) {
  currentSelect = items.indexOf(item);
  syncControls(item);
  scene.select(item);
}

function nextSelection () {
  var selection = items[(currentSelect >= items.length-1) ? 0 : currentSelect+1];
  setSelection(selection);
}

function prevSelection () {
  var selection = items[(currentSelect <= 0) ? items.length-1 : currentSelect-1];
  setSelection(selection);
}

function removeSelection () {
  removeItem(items[currentSelect]);
  noSelection();
}

function duplicateSelection () {
  var item = items[currentSelect];
  item = cloneItem(item);
  console.log(item);
  items.push(item);
  if (item instanceof OpaqueObject)
    scene.addObject(item);
  else if (item instanceof Light)
    scene.addLight(item);
  setSelection(item);
  moveItemDelta = new Vec2();
  mousedownItem = item;
  mousedown = mousep;
}

function cloneItem (o) {
  if (o instanceof Lamp) {
    return new Lamp(o.position.copy(), o.distance, o.diffuse, o.color, o.radius, o.samples, o.angle, o.roughness);
  }
  else if (o instanceof PolygonObject) {
    var points = [];
    for (var i=0; i<o.points.length; ++i) {
      points.push(o.points[i].copy());
    }
    return new PolygonObject(points);
  }
  else if (o instanceof DiscObject) {
    return new DiscObject(o.center.copy(), o.radius);
  }
}

function removeItem (o) {
  var i = items.indexOf(o);
  if (i!=-1) items.splice(i, 1);
  if (o instanceof Light) {
    scene.removeLight(o);
  }
  else if (o instanceof OpaqueObject) {
    scene.removeObject(o);
  }
}

function move (item, delta) {
  if (item instanceof Light) {
    item.position = item.position.add(delta);
  }
  else if(item instanceof PolygonObject) {
    for (i=0; i<item.points.length; i++) {
      item.points[i] = item.points[i].add(delta);
    }
  }
  else if (item instanceof DiscObject) {
    item.center = item.center.add(delta);
  }
  $(item).change();
}


function getItemAt (p) {
  for (var i=0; i<items.length; ++i) {
    var item = items[i];
    if (item instanceof Light) {
      var c = item.position;
      var radius = getSelectionRadiusForLight(item);
      if (p && p.dist2(c) < radius*radius)
        return item;
    }
    else if(item instanceof OpaqueObject) {
      if (item.contains(p))
        return item;
    }
  }
}

function addPolygonPoint (p) {
  if (!buildPoly) {
    buildPoly = [ p ];
    syncControls(null);
  }
  else {
    if (buildPoly[0].dist2(p) < DIST_CLOSE*DIST_CLOSE) {
      if (buildPoly.length >= 2 && buildPoly[0].dist2(buildPoly[1])>=DIST_CLOSE*DIST_CLOSE) {
        var o = new PolygonObject(buildPoly);
        scene.addObject(o);
        items.push(o);
        setSelection(o);
      }
      selectTool(null);
      buildPoly = null;
    }
    else {
      buildPoly.push(p);
    }
  }
  dirty = true;
}

function selectTool (cl, node) {
  currentToolSelected = cl;
  if (cl) {
    $tools.removeClass("selected");
    node.addClass("selected");
    var hoverText = node.attr("data-canvas-hoverText");
    if (hoverText) {
      $(canvas).attr("data-hoverText", hoverText);
    }
  }
  else {
    $tools.removeClass("selected");
    $(canvas).removeAttr("data-hoverText");
    hoverPopup.hide();
  }
}


var metal = new Image();
metal.onload = function(){ dirty = true }
metal.src = "galvanized-plate.jpg";

function render () {
  if (!dirty) return; dirty = false;
  ctx.save();
  ctx.fillStyle = "#888";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  
  // DEBUG render
  for (var o=0; o<scene.objects.length; ++o) {
    ctx.save();
    var obj = scene.objects[o];
    ctx.beginPath();
    obj.path(ctx);
    ctx.clip();
    var bounds = obj.bounds();
    var topleft = bounds.topleft;
    ctx.drawImage(metal, topleft.x, topleft.y);
    ctx.restore();
    ctx.save();
    if (obj===scene.selected) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = SELECTED_STROKE;
      ctx.beginPath();
      obj.path(ctx);
      ctx.stroke();
    }
    else {
      if (mousep && obj.contains(mousep)) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = HOVER_STROKE;
      }
      else {
        ctx.lineWidth = 1;
        ctx.strokeStyle = OBJECT_STROKE;
      }
      ctx.beginPath();
      obj.path(ctx);
      ctx.stroke();
    }
    ctx.restore();
  }

  scene.render(ctx);

  for (var o=0; o<scene.lights.length; ++o) {
    var light = scene.lights[o];
    var c = light.position;
    var radius = getSelectionRadiusForLight(light);
    if (light===scene.selected) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = SELECTED_STROKE;
      ctx.beginPath();
      ctx.arc(c.x, c.y, radius, 0, 2*Math.PI); 
      ctx.stroke();
    }
    else if (mousep && mousep.dist2(c) < radius*radius) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = HOVER_STROKE;
      ctx.beginPath();
      ctx.arc(c.x, c.y, radius, 0, 2*Math.PI); 
      ctx.stroke();
    }
  }

  ctx.strokeStyle="rgba(200,0,0,0.9)";
  ctx.lineWidth = 1;
  if (buildPoly) {
    ctx.beginPath();
    ctx.moveTo(buildPoly[0].x, buildPoly[0].y);
    for (var i=1; i<buildPoly.length; ++i) {
      var p = buildPoly[i];
      ctx.lineTo(p.x, p.y);
    }
    ctx.lineTo(mousep.x, mousep.y);
    ctx.stroke();
    if (buildPoly[0].dist2(mousep) < DIST_CLOSE*DIST_CLOSE) {
      ctx.fillStyle = "rgba(200,0,0,0.2)";
      ctx.fill();
      ctx.fillStyle = "rgba(200,0,0,0.5)";
      ctx.beginPath();
      ctx.arc(buildPoly[0].x, buildPoly[0].y, DIST_CLOSE-2, 0, Math.PI*2);
      ctx.fill();
    }
  }

  ctx.restore();
}


init();
bind();
requestAnimFrame(function loop(){
  requestAnimFrame(loop, canvas);
  render();
}, canvas);

}());
