(function(cp){

  function map(arr,f) {
    var t=[]; for(var i=0;i<arr.length;++i) t[i]=f(arr[i]); return t;
  }

// add fromJson and toJson methods on every classes of cp.js
cp.Vec2.fromJson = function(js){
  return new cp.Vec2(js.x, js.y);
}
cp.Light.fromJson = function (js) {
  if (cp[js.instance]) return cp[js.instance].fromJson(js);
  else return new cp.Light(cp.Vec2.fromJson(js.position), js.distance, js.diffuse);
}
cp.Light.prototype.toJson = function () {
  return { position: this.position.toJson(), distance: this.distance, diffuse: this.diffuse };
}

cp.OpaqueObject.fromJson = function (js) {
  if (cp[js.instance])
    return cp[js.instance].fromJson(js);
}
cp.OpaqueObject.prototype.toJson = function () {}

cp.Lamp.fromJson = function (js) {
  return new cp.Lamp(cp.Vec2.fromJson(js.position), js.distance, js.diffuse, js.color, js.radius, js.samples, js.angle, js.roughness);
}
cp.Lamp.prototype.toJson = function () {
  return { instance: "Lamp", position: this.position.toJson(), distance: this.distance, diffuse: this.diffuse, color: this.color, distance: this.distance, radius: this.radius, samples: this.samples, angle: this.angle, roughness: this.roughness };
}

cp.DiscObject.fromJson = function (js) {
  return new cp.DiscObject(cp.Vec2.fromJson(js.center), js.radius);
}
cp.DiscObject.prototype.toJson = function () {
  return { instance: "DiscObject", center: this.center.toJson(), radius: this.radius };
}

cp.PolygonObject.fromJson = function (js) {
  return new cp.PolygonObject( map(js.points, function(p){ return cp.Vec2.fromJson(p) }) );
}
cp.PolygonObject.prototype.toJson = function () {
  return { instance: "PolygonObject", points: map(this.points, function(p){ return p.toJson() }) };
}

}(window.illuminated));
