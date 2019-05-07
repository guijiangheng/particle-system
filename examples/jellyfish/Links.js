export function radial(indexCenter, start, segments, links) {
  for (let i = 0; i < segments; ++i) {
    links.push(indexCenter, start + i);
  }
}

export function line(start, numPartices, buffer) {
  for (let i = 0; i < numPartices - 1; ++i) {
    buffer.push(start + i, start + i + 1);
  }
}

export function ring(aStart, bStart, segments, buffer) {
  for (let i = 0; i < segments; ++i) {
    buffer.push(aStart + i, bStart + i);
  }
}
