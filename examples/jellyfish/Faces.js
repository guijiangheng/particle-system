export function radial(indexCenter, indexStart, segments, buffer) {
  for (let i = 0; i < segments; ++i) {
    buffer.push(indexCenter, indexStart + i, indexStart + ((i + 1) % segments));
  }
}

export function ring(aStart, bStart, segments, buffer) {
  for (let i = 0; i < segments; ++i) {
    const a = aStart + i;
    const b = aStart + ((i + 1) % segments);
    const c = bStart + ((i + 1) % segments);
    const d = bStart + i;
    buffer.push(a, d, c);
    buffer.push(c, b, a);
  }
}

export function quad(a, b, c, d, faces) {
  faces.push(c, b, a);
  faces.push(c, d, b);
}
