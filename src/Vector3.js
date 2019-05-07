export default class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  add(v) {
    return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  sub(v) {
    return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  multiply(k) {
    return new Vector3(this.x * k, this.y * k, this.z * k);
  }

  divide(k) {
    return this.multiply(1 / k);
  }

  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  lengthSquared() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  length() {
    return Math.sqrt(this.lengthSquared());
  }

  distanceSquared(v) {
    return this.sub(v).lengthSquared();
  }

  distance(v) {
    return this.sub(v).length();
  }

  normalize() {
    return this.divide(this.length());
  }

  clone() {
    return new Vector3(this.x, this.y, this.z);
  }
}
