(function(){

/**
 * This Scene object is only made for the demo page,
 * you can inspire from it but
 * only illuminated.js should be used.
 */

var Light = illuminated.Light
, Lamp = illuminated.Lamp
, Vec2 = illuminated.Vec2
, OpaqueObject = illuminated.OpaqueObject
, PolygonObject = illuminated.PolygonObject
, DiscObject = illuminated.DiscObject
, RectangleObject = illuminated.RectangleObject
, Lighting = illuminated.Lighting
, DarkMask = illuminated.DarkMask
;


function Scene (ctx, lights, objects, globals) {
  this.ctx = ctx;
  this.lights = lights||[];
  this.objects = objects||[];

  this.lightings = [];
  this.darkmask = new DarkMask({ lights: this.lights, color: globals.maskcolor });
  this.darkmask.compute(ctx.canvas.width, ctx.canvas.height);
  for (var l=0; l<this.lights.length; ++l) {
    var light = this.lights[l];
    var lighting = new Lighting({ light: light, objects: this.objects });
    this.lightings.push(lighting);
    lighting.compute(ctx.canvas.width, ctx.canvas.height);
    this.bindLight(light);
  }
  for (var i=0; i<this.objects.length; ++i) {
    this.bindObject(this.objects[i]);
  }
  this.triggerChange();
}

Scene.fromJson = function(ctx, js) {
  return new Scene(
    ctx,
    $.map(js.lights||[], function(o){ return Light.fromJson(o) }), 
    $.map(js.objects||[], function(o){ return OpaqueObject.fromJson(o) }), 
    js.globals||[]
  );
}
Scene.prototype.toJson = function () {
  return { 
    lights: $.map(this.lights, function(o) {
      return o.toJson();
    }), 
    objects: $.map(this.objects, function(o) {
      return o.toJson();
    }),
    globals: { // FIXME : use darkmask
      maskcolor: this.darkmask.color
    }
  };
}


Scene.prototype.select = function (item) {
  this.selected = item;
}

Scene.prototype.unselect = function () {
  this.selected = null;
}

Scene.prototype.triggerChange = function () {
  this.dirty = true;
  $(this).trigger("change");
}

Scene.prototype.onChange = function (fn) {
  $(this).on("change", fn);
}

Scene.prototype.bindObject = function (obj) {
  var self = this;
  $(obj).change(function(){
    for (var l=0; l<self.lightings.length; ++l) {
      self.lightings[l].compute(self.ctx.canvas.width, self.ctx.canvas.height);
    }
    self.triggerChange();
  });
}

Scene.prototype.addObject = function (obj) {
  this.objects.push(obj);
  this.bindObject(obj);
  $(obj).change();
}

Scene.prototype.bindLight = function (light) {
  var self = this;
  $(light).change(function(){
    var i = self.indexOfLightingForLight(light);
    if (i!=-1) {
      self.lightings[i].compute(self.ctx.canvas.width, self.ctx.canvas.height);
    }
    self.darkmask.compute(self.ctx.canvas.width, self.ctx.canvas.height);
    self.triggerChange();
  });
}

Scene.prototype.addLight = function (light) {
  this.lights.push(light);
  var l = new Lighting({ light: light, objects: this.objects, diffuse: 0.2 });
  this.lightings.push(l);
  this.bindLight(light);
  $(light).change();
}

Scene.prototype.indexOfLightingForLight = function (light) {
  for (var i = 0; i<this.lightings.length; ++i) {
    if (this.lightings[i].light === light) {
      return i;
    }
  }
  return -1;
}

Scene.prototype.removeLight = function (light) {
  var i = this.lights.indexOf(light);
  if (i!=-1) this.lights.splice(i, 1);
  i = this.indexOfLightingForLight(light);
  if (i!=-1) this.lightings.splice(i, 1);
  this.darkmask.compute(this.ctx.canvas.width, this.ctx.canvas.height);
  this.triggerChange();
}

Scene.prototype.removeObject = function (obj) {
  var i = this.objects.indexOf(obj);
  if (i!=-1) this.objects.splice(i, 1);
  for (var l=0; l<this.lightings.length; ++l) {
    this.lightings[l].compute(this.ctx.canvas.width, this.ctx.canvas.height);
  }
  this.darkmask.compute(this.ctx.canvas.width, this.ctx.canvas.height);
  this.triggerChange();
}

Scene.prototype.setMaskColor = function (color) {
  this.darkmask.color = color;
  this.darkmask.compute(this.ctx.canvas.width, this.ctx.canvas.height);
  this.triggerChange();
}

Scene.prototype.getMaskColor = function () {
  return this.darkmask.color;
}

Scene.prototype.setOption = function (name, value) {
  if (this.selected) {
    this.selected[name] = value;
    $(this.selected).change();
  }
}

Scene.prototype.render = function (ctx) {
  var dirty = !!this.dirty;
  this.dirty = false;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (var l=0; l<this.lightings.length; ++l) {
    this.lightings[l].render(ctx);
  }
  ctx.globalCompositeOperation = "source-over";
  this.darkmask.render(ctx);
  ctx.restore();
}

window.Scene = Scene;

}());
