(function(cp){

  function map(arr,f) {
    var t=[]; for(var i=0;i<arr.length;++i) t[i]=f(arr[i]); return t;
  }

// add fromJson and toJson methods on every classes of cp.js
cp.Vec2.fromJson = function(js){
  return new cp.Vec2(js.x, js.y);
}
cp.Vec2.prototype.toJson = function(){
  return { x: this.x, y: this.y };
}

cp.Light.fromJson = function (js) {
  js.position = new cp.Vec2(js.position.x, js.position.y);
  if (cp[js.instance]) return cp[js.instance].fromJson(js);
  else return new cp.Light(js);
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
  js.position = new cp.Vec2(js.position.x, js.position.y);
  return new cp.Lamp(js);
}
cp.Lamp.prototype.toJson = function () {
  return { instance: "Lamp", position: this.position.toJson(), distance: this.distance, diffuse: this.diffuse, color: this.color, distance: this.distance, radius: this.radius, samples: this.samples, angle: this.angle, roughness: this.roughness };
}

cp.DiscObject.fromJson = function (js) {
  js.center = new cp.Vec2(js.center.x, js.center.y);
  return new cp.DiscObject(js);
}
cp.DiscObject.prototype.toJson = function () {
  return { instance: "DiscObject", center: this.center.toJson(), radius: this.radius };
}

cp.PolygonObject.fromJson = function (js) {
  js.points = map(js.points, function(p){ return cp.Vec2.fromJson(p) });
  return new cp.PolygonObject(js);
}
cp.PolygonObject.prototype.toJson = function () {
  return { instance: "PolygonObject", points: map(this.points, function(p){ return p.toJson() }) };
}

}(window.illuminated));
