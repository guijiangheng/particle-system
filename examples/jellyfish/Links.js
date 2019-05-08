export function radial(indexCenter, start, segments, buffer) {
  for (let i = 0; i < segments; ++i) {
    buffer.push(indexCenter, start + i);
  }
  return buffer;
}

export function line(start, numPartices, buffer) {
  for (let i = 0; i < numPartices - 1; ++i) {
    buffer.push(start + i, start + i + 1);
  }
  return buffer;
}

export function loop(start, segments, buffer) {
  for (let i = 0; i < segments; ++i) {
    buffer.push(start + i, start + ((i + 1) % segments));
  }
  return buffer;
}

export function ring(aStart, bStart, segments, buffer) {
  for (let i = 0; i < segments; ++i) {
    buffer.push(aStart + i, bStart + i);
  }
  return buffer;
}
