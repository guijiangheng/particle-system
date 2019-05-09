export function radial(indexCenter, indexStart, segments, buffer) {
  for (let i = 0; i < segments; ++i) {
    buffer.push(indexCenter, indexStart + ((i + 1) % segments), indexStart + i);
  }
}

export function ring(aStart, bStart, segments, buffer) {
  for (let i = 0; i < segments; ++i) {
    const a = aStart + i;
    const b = aStart + ((i + 1) % segments);
    const c = bStart + ((i + 1) % segments);
    const d = bStart + i;
    buffer.push(a, b, c);
    buffer.push(d, a, c);
  }
}

export function quad(a, b, c, d, faces) {
  faces.push(a, b, c);
  faces.push(b, c, a);
}
