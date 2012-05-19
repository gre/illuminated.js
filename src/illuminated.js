/**!
 * Illuminated.js - A 2D lights and shadows rendering engine for HTML5 applications and games.
 *
 * Copyright (C) 2012 Gaëtan Renaudeau <renaudeau.gaetan@gmail.com>
 * http://greweb.fr/illuminated.js/
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function(cp){
 /**
   * Vec2 - A 2D Vector with some operations on it
   */
  cp.Vec2 = function (x, y) {
    this.x = x||0;
    this.y = y||0;
  }

  cp.Vec2.prototype.copy = function () {
    return new cp.Vec2(this.x, this.y);
  }
  cp.Vec2.prototype.dot = function (v) {
    return v.x*this.x + v.y*this.y;
  }
  cp.Vec2.prototype.sub = function (v) {
    return new cp.Vec2(this.x-v.x, this.y-v.y);
  }
  cp.Vec2.prototype.add = function (v) {
    return new cp.Vec2(this.x+v.x, this.y+v.y);
  }
  cp.Vec2.prototype.mul = function (n) {
    return new cp.Vec2(this.x*n, this.y*n);
  }
  cp.Vec2.prototype.inv = function () {
    return this.mul(-1);
  }
  cp.Vec2.prototype.dist2 = function (v) {
    var dx = this.x - v.x;
    var dy = this.y - v.y;
    return dx*dx + dy*dy;
  }
  cp.Vec2.prototype.normalize = function () {
    var length = Math.sqrt(this.length2());
    return new cp.Vec2(this.x/length, this.y/length);
  }
  cp.Vec2.prototype.length2 = function (v) {
    return this.x*this.x + this.y*this.y;
  }
  cp.Vec2.prototype.toString = function () {
    return this.x+","+this.y;
  }
  cp.Vec2.prototype.inBound = function (topleft, bottomright) {
    return (topleft.x < this.x && this.x < bottomright.x
         && topleft.y < this.y && this.y < bottomright.y);
  }


  /**
   * Light: interface of a light
   * @arg position
   * @arg distance: the radius max distance the light emit color
   */
  cp.Light = function (options) { extend(this, cp.Light.defaults, options); }
  cp.Light.defaults = {
    position: new cp.Vec2(),
    distance: 100,
    diffuse: 0.8
  };
  
  
  /**
   * Render the light
   */
  cp.Light.prototype.render = function (ctx) {}

  /**
   * Render a mask representing the visibility
   * used by DarkMask
   */
  cp.Light.prototype.mask = function (ctx) {
    var c = this._getVisibleMaskCache();
    ctx.drawImage(c.canvas, Math.round(this.position.x-c.w/2), Math.round(this.position.y-c.h/2));
  }
  /**
   * Return a { topleft, bottomright } (outside are not impacted by the light)
   * By default use the distance
   */
  cp.Light.prototype.bounds = function () {
    return {
      topleft: new cp.Vec2(this.position.x-this.distance, this.position.y-this.distance),
      bottomright: new cp.Vec2(this.position.x+this.distance, this.position.y+this.distance)
    }
  }
  
  /**
   * Return the center of the light = the position where the light intensity is the highest
   */
  cp.Light.prototype.center = function () {
    return new cp.Vec2( this.distance, this.distance );
  }

  // Implement it by spreading samples and calling f at each time
  cp.Light.prototype.forEachSample = function (f) { f(this.position); }

  cp.Light.prototype._getVisibleMaskCache = function () {
    // By default use a radial gradient based on the distance
    var d = Math.floor(this.distance*1.4);
    var hash = ""+d;
    if (this.vismaskhash != hash) {
      this.vismaskhash = hash;
      var c = this._vismaskcache = createCanvasAnd2dContext(2*d, 2*d);
      var g = c.ctx.createRadialGradient(d, d, 0, d, d, d);
      g.addColorStop( 0, 'rgba(0,0,0,1)' );
      g.addColorStop( 1, 'rgba(0,0,0,0)' );
      c.ctx.fillStyle = g;
      c.ctx.fillRect(0, 0, c.w, c.h);
    }
    return this._vismaskcache;
  }


  /**
   * OpaqueObject: interface of an opaque object
   */
  cp.OpaqueObject = function (options) { extend(this, cp.OpaqueObject.defaults, options); }
  cp.OpaqueObject.defaults = { diffuse: 0.8 };
  cp.OpaqueObject.prototype.cast = function (ctx, origin, bounds) { }
  cp.OpaqueObject.prototype.path = function (ctx) { }
  cp.OpaqueObject.prototype.bounds = function () { return { topleft: new cp.Vec2(), bottomright: new cp.Vec2() } }
  cp.OpaqueObject.prototype.contains = function (point) { return false }


  // LIGHTS

  /**
   * Lamp - Create a circular light.
   * @arg color: the color emited by the light
   * @arg radius: the radius size of the light
   * @arg samples: the number of light points which will be used for shadow projection (points are placed on the radius circle)
   */
  cp.Lamp = function (options) { extend(this, cp.Light.defaults, cp.Lamp.defaults, options); }
  inherit(cp.Lamp, cp.Light);

  cp.Lamp.defaults = {
    color: 'rgba(250,220,150,0.8)',
    radius: 0,
    samples: 1,
    angle: 0,
    roughness: 0
  };

  cp.Lamp.prototype._getHashCache = function () {
    return [this.color, this.distance, this.diffuse, this.angle, this.roughness].toString();
  }

  cp.Lamp.prototype.center = function () {
    return new cp.Vec2( (1-Math.cos(this.angle)*this.roughness)*this.distance, (1+Math.sin(this.angle)*this.roughness)*this.distance );
  }

  cp.Lamp.prototype._getGradientCache = function (center) {
    var hashcode = this._getHashCache();
    if (this._cacheHashcode == hashcode) {
      return this._gcache;
    }
    this._cacheHashcode = hashcode;
    var d = Math.round(this.distance);
    var D = d*2;
    var cache = createCanvasAnd2dContext(D, D);
    var g = cache.ctx.createRadialGradient(center.x, center.y, 0, d, d, d);
    g.addColorStop( Math.min(1,this.radius/this.distance), this.color );
    g.addColorStop( 1, cp.getRGBA(this.color, 0) );
    cache.ctx.fillStyle = g;
    cache.ctx.fillRect(0, 0, cache.w, cache.h);
    return this._gcache = cache;
  }

  cp.Lamp.prototype.render = function (ctx) {
    var center = this.center();
    var c = this._getGradientCache(center);
    ctx.drawImage(c.canvas, Math.round(this.position.x-center.x), Math.round(this.position.y-center.y))
  }

  cp.Lamp.prototype.forEachSample = function (f) {
    // "spiral" algorithm for spreading emit samples
    for (var s=0; s<this.samples; ++s) {
      var a = s * GOLDEN_ANGLE;
      var r = Math.sqrt(s/this.samples)*this.radius;
      var delta = new cp.Vec2( Math.cos(a)*r, Math.sin(a)*r );
      f( this.position.add(delta) );
    }
  }

  /**
   * Spot
   * TODO
   */
  /*
  cp.Spot = function (position, distance) {
    this.position = position;
    this.distance = position;
  }
  inherit(cp.Spot, cp.Light);
  */

  /**
   * Neon
   * TODO
   */
  /*
  cp.Neon = function (position, distance, color, size, samples, angle) {
    this.position = position;
    this.distance = distance;
    this.color = color;
    this.size = size || 10;
    this.samples = samples || 2;
    this.angle = angle || 0;
  }
  inherit(cp.Neon, cp.Light);

  // TODO .center() and .bound()

  cp.Neon.prototype.render = function (ctx) {
    var center = this.center();
    var c = this._getGradientCache(center);
    ctx.drawImage(c.canvas, Math.round(this.position.x-center.x), Math.round(this.position.y-center.y))
  }

  cp.Neon.prototype._getHashCache = function () {
    return [this.color, this.distance, this.angle].toString();
  }

  cp.Neon.prototype._getGradientCache = function (center) {
    var hashcode = this._getHashCache();
    if (this.cacheHashcode == hashcode) {
      return this.gradientCache;
    }
    this.cacheHashcode = hashcode;
    var d = Math.round(this.distance);
    var D = d*2;
    var cache = createCanvasAnd2dContext(D, D);
    var g = cache.ctx.createRadialGradient(center.x, center.y, 0, d, d, d);
    g.addColorStop( 0, this.color );
    g.addColorStop( 1, 'rgba(0,0,0,0)' );
    cache.ctx.fillStyle = g;
    cache.ctx.fillRect(0, 0, cache.w, cache.h);
    return this.gradientCache = cache;
  }
  */

  /**
   * OrientedNeon: Neon with one side
   * TODO
   */
  /*
  cp.OrientedNeon = function (position, distance) {
    this.position = position;
    this.distance = position;
  }
  inherit(cp.OrientedNeon, cp.Light);
  */

  // OBJECTS

  cp.DiscObject = function (options) { extend(this, cp.OpaqueObject.defaults, cp.DiscObject.defaults, options); }
  inherit(cp.DiscObject, cp.OpaqueObject);

  cp.DiscObject.defaults = {
    center: new cp.Vec2(),
    radius: 20
  };

  cp.DiscObject.prototype.cast = function (ctx, origin, bounds) {
    // FIXME: the current method is wrong... TODO must see http://en.wikipedia.org/wiki/Tangent_lines_to_circles
    var m = this.center;
    var originToM = m.sub(origin);

    var d = new cp.Vec2(originToM.y, -originToM.x).normalize().mul(this.radius);
    
    var a = this.center.add(d);
    var b = this.center.add(d.inv());

    var originToA = a.sub(origin);
    var originToB = b.sub(origin);

    // normalize to distance
    var distance = ((bounds.bottomright.x-bounds.topleft.x)+(bounds.bottomright.y-bounds.topleft.y))/2;
    originToM = originToM.normalize().mul(distance);
    originToA = originToA.normalize().mul(distance);
    originToB = originToB.normalize().mul(distance);
    
    // project points
    var oam = a.add(originToM);
    var obm = b.add(originToM);
    var ap = a.add(originToA);
    var bp = b.add(originToB);

    var start = Math.atan2(originToM.x, -originToM.y);
    ctx.beginPath();
    path(ctx, [b, bp, obm, oam, ap, a], true);
    ctx.arc(m.x, m.y, this.radius, start, start+Math.PI);
    ctx.fill();
  }

  cp.DiscObject.prototype.path = function (ctx) {
    ctx.arc(this.center.x, this.center.y, this.radius, 0, _2PI);
  }
  
  cp.DiscObject.prototype.bounds = function () { 
    return { 
      topleft: new cp.Vec2(this.center.x-this.radius, this.center.y-this.radius),
      bottomright: new cp.Vec2(this.center.x+this.radius, this.center.y+this.radius)
    } 
  }
  
  cp.DiscObject.prototype.contains = function (point) { 
    return point.dist2(this.center) < this.radius*this.radius;
  }

  /**
   * PolygonObject - Define an opaque polygon object
   * @arg points: array of Vec2, points of the polygon
   */
  cp.PolygonObject = function (options) { extend(this, cp.OpaqueObject.defaults, cp.PolygonObject.defaults, options); }
  inherit(cp.PolygonObject, cp.OpaqueObject);

  cp.PolygonObject.defaults = {
    points: []
  };

  cp.PolygonObject.prototype.bounds = function () {
    var topleft = this.points[0].copy();
    var bottomright = topleft.copy();
    for (var p=1; p<this.points.length; ++p) {
      var point = this.points[p];
      if (point.x > bottomright.x)
        bottomright.x = point.x;
      if (point.y > bottomright.y)
        bottomright.y = point.y;
      if (point.x < topleft.x)
        topleft.x = point.x;
      if (point.y < topleft.y)
        topleft.y = point.y;
    }
    return { topleft: topleft, bottomright: bottomright };
  }

  cp.PolygonObject.prototype.contains = function (p) {
    var points = this.points;
    var i, j=points.length-1;
    var x = p.x, y = p.y;
    var oddNodes = false;

    for (i=0; i<points.length; i++) {
      if ((points[i].y< y && points[j].y>=y
      ||   points[j].y< y && points[i].y>=y)
      &&  (points[i].x<=x || points[j].x<=x)) {
        if (points[i].x+(y-points[i].y)/(points[j].y-points[i].y)*(points[j].x-points[i].x)<x) {
          oddNodes=!oddNodes; 
        }
      }
      j=i; 
    }
    return oddNodes;
  }

  cp.PolygonObject.prototype.path = function (ctx) {
    path(ctx, this.points);
  }
  /**
   * cast shadows renders a black mask of the shadow
   */
  cp.PolygonObject.prototype.cast = function (ctx, origin, bounds) {
    // The current implementation of projection is a bit hacky... do you have a proper solution?
    var distance = ((bounds.bottomright.x-bounds.topleft.x)+(bounds.bottomright.y-bounds.topleft.y))/2;
    this._forEachVisibleEdges(origin, bounds, function (a, b, originToA, originToB, aToB) {
      var m; // m is the projected point of origin to [a, b]
      var t = originToA.inv().dot(aToB)/aToB.length2();
      if (t<0)
        m = a;
      else if(t>1)
        m = b;
      else
        m = a.add( aToB.mul(t) );
      var originToM = m.sub(origin);
      // normalize to distance
      originToM = originToM.normalize().mul(distance);
      originToA = originToA.normalize().mul(distance);
      originToB = originToB.normalize().mul(distance);
      // project points
      var oam = a.add(originToM);
      var obm = b.add(originToM);
      var ap = a.add(originToA);
      var bp = b.add(originToB);
      ctx.beginPath();
      path(ctx, [a, b, bp, obm, oam, ap]);
      ctx.fill();
    });
  }

  cp.PolygonObject.prototype._forEachVisibleEdges = function (origin, bounds, f) {
    var a = this.points[this.points.length-1], b;
    for (var p=0; p<this.points.length; ++p, a=b) {
      b = this.points[p];
      if (a.inBound(bounds.topleft, bounds.bottomright)) {
         var originToA = a.sub(origin);
         var originToB = b.sub(origin);
         var aToB = b.sub(a);
         var normal = new cp.Vec2(aToB.y, -aToB.x);
         if (normal.dot(originToA) < 0) {
           f(a, b, originToA, originToB, aToB);
         }
       }
    }
  }


  cp.RectangleObject = function (options) {
    extend(this, cp.OpaqueObject.defaults, cp.PolygonObject.defaults, cp.RectangleObject.defaults, options);
    this.syncFromTopleftBottomright();
  }
  inherit(cp.RectangleObject, cp.PolygonObject);

  cp.RectangleObject.defaults = { topleft: new cp.Vec2(), bottomright: new cp.Vec2() };

  cp.RectangleObject.prototype.syncFromTopleftBottomright = function () {
    var a = this.topleft;
    var b = new cp.Vec2(this.bottomright.x, this.topleft.y);
    var c = this.bottomright;
    var d = new cp.Vec2(this.topleft.x, this.bottomright.y);
    this.points = [a, b, c, d];
  }

  cp.RectangleObject.prototype.fill = function (ctx) {
    var x = this.points[0].x, y = this.points[0].y;
    ctx.rect(x, y, this.points[2].x-x, this.points[2].y-y);
  }
  
  cp.LineObject = function (options) {
    extend(this, cp.OpaqueObject.defaults, cp.PolygonObject.defaults, cp.LineObject.defaults, options);
    this.syncFromAB();
  }
  inherit(cp.LineObject, cp.PolygonObject);

  cp.LineObject.defaults = { a: new cp.Vec2(), b: new cp.Vec2() };
  cp.LineObject.prototype.syncFromAB = function () {
    this.points = [this.a, this.b];
  }

  /**
   * Lighting - Provide a lighting effect which projects shadows on opaque objects
   * @arg light: a Light object which project light in the scene
   * @arg objects: all opaque objects which stop the light and create shadows
   */
  cp.Lighting = function (opts) {
    extend(this, cp.Lighting.defaults, opts);
  }

  cp.Lighting.defaults = {
    light: new cp.Light(),
    objects: []
  }

  cp.Lighting.prototype.createCache = function (w, h) {
    this._cache = createCanvasAnd2dContext(w,h);
    this._castcache = createCanvasAnd2dContext(w,h);
  }

  cp.Lighting.prototype.cast = function (ctxoutput) {
    var light = this.light;
    var n = light.samples;
    var c = this._castcache;
    var ctx = c.ctx;
    ctx.clearRect(0, 0, c.w, c.h);
    // Draw shadows for each light sample and objects
    ctx.fillStyle = "rgba(0,0,0,"+Math.round(100/n)/100+")"; // Is there any better way?
    var bounds = light.bounds();
    var objects = this.objects;
    light.forEachSample(function (position) {
      var sampleInObject = false;
      for (var o=0; o<objects.length; ++o) {
        if (objects[o].contains(position)) {
          ctx.fillRect(bounds.topleft.x, bounds.topleft.y, bounds.bottomright.x-bounds.topleft.x, bounds.bottomright.y-bounds.topleft.y);
          return;
        }
      }
      objects.forEach(function(object) {
        object.cast(ctx, position, bounds);
      });
    });
    // Draw objects diffuse - the intensity of the light penetration in objects
    objects.forEach(function(object) {
      var diffuse = object.diffuse===undefined ? 0.8 : object.diffuse;
      diffuse *= light.diffuse;
      ctx.fillStyle = "rgba(0,0,0,"+(1-diffuse)+")";
      ctx.beginPath();
      object.path(ctx);
      ctx.fill();
    });
    ctxoutput.drawImage(c.canvas, 0, 0);
  }

  cp.Lighting.prototype.compute = function (w,h) {
    if (!this._cache || this._cache.w != w || this._cache.h != h)
      this.createCache(w, h);
    var ctx = this._cache.ctx;
    var light = this.light;
    ctx.save();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    light.render(ctx);
    ctx.globalCompositeOperation = "destination-out";
    this.cast(ctx);
    ctx.restore();
  }
  cp.Lighting.prototype.render = function (ctx) {
    ctx.drawImage(this._cache.canvas, 0, 0);
  }

  /**
   * DarkMask - Provide a dark mask which is transparent in lights
   */
  cp.DarkMask = function (options) {
    extend(this, cp.DarkMask.defaults, options);
  }

  cp.DarkMask.defaults = {
    lights: [],
    color: 'rgba(0,0,0,0.9)'
  }

  cp.DarkMask.prototype.compute = function (w,h) {
    if (!this._cache || this._cache.w != w || this._cache.h != h)
      this._cache = createCanvasAnd2dContext(w,h);
    var ctx = this._cache.ctx;
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "destination-out";
    this.lights.forEach(function(light){
      light.mask(ctx);
    });
    ctx.restore();
  }
  cp.DarkMask.prototype.render = function (ctx) {
    ctx.drawImage(this._cache.canvas, 0, 0);
  }

   // UTILS & CONSTANTS

  var GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  var _2PI = 2*Math.PI;

  function createCanvasAnd2dContext (w, h) {
    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    return { canvas: canvas, ctx: canvas.getContext("2d"), w: w, h: h };
  }
  cp.createCanvasAnd2dContext = createCanvasAnd2dContext;

  function path (ctx, points, dontJoinLast) {
    var p = points[0];
    ctx.moveTo(p.x, p.y);
    for (var i=1; i<points.length; ++i) {
      p = points[i];
      ctx.lineTo(p.x, p.y);
    }
    if (!dontJoinLast && points.length>2) {
      p = points[0];
      ctx.lineTo(p.x, p.y);
    }
  }
  cp.path = path;

  var getRGBA = cp.getRGBA = (function(){
    var canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    var ctx = canvas.getContext("2d");
    return function (color, alpha) {
      ctx.clearRect(0,0,1,1);
      ctx.fillStyle = color;
      ctx.fillRect(0,0,1,1);
      var d = ctx.getImageData(0,0,1,1).data;
      return 'rgba('+[ d[0], d[1], d[2], alpha ]+')';
    }
  }());

  var extractColorAndAlpha = cp.extractColorAndAlpha = (function(){
    var canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    var ctx = canvas.getContext("2d");

    function toHex (value) { 
      var s = value.toString(16); 
      if(s.length==1) s = "0"+s;
      return s;
    }

    return function (color) {
      ctx.clearRect(0,0,1,1);
      ctx.fillStyle = color;
      ctx.fillRect(0,0,1,1);
      var d = ctx.getImageData(0,0,1,1).data;
      return {
        color: "#"+toHex(d[0])+toHex(d[1])+toHex(d[2]),
        alpha: Math.round(1000*d[3]/255)/1000
      };
    }
  }());

  function extend (extending /* , arg1, arg2, ... */) {
    for(var a=1; a<arguments.length; ++a) {
      var source = arguments[a];
      if (source) {
        for (var prop in source)
          if (source[prop] !== void 0)
            extending[prop] = source[prop];
      }
    }
  }
  illuminated.extend = extend;

  function emptyFn() {};
  function inherit (cls, base) { // from Box2d
    var tmpCtr = cls;
    emptyFn.prototype = base.prototype;
    cls.prototype = new emptyFn;
    cls.prototype.constructor = tmpCtr;
    cls.prototype.__super = base.prototype;
  }
  cp.inherit = inherit;

}(window.illuminated={}));
