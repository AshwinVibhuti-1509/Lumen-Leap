/**
 * Enemy navigation on the XY plane (the game's vertical axis is Z).
 * Functions here are independent of Three.js so routing can be unit-tested.
 */
export function pursuitStep(fromX, fromY, targetX, targetY, speed, deltaTime) {
  const dx = targetX - fromX;
  const dy = targetY - fromY;
  const distance = Math.hypot(dx, dy);
  if (distance < 1e-8 || speed <= 0 || deltaTime <= 0) {
    return { x: fromX, y: fromY, headingX: dx, headingY: dy, distance };
  }
  const travel = Math.min(speed * deltaTime, distance);
  return {
    x: fromX + dx / distance * travel,
    y: fromY + dy / distance * travel,
    headingX: dx,
    headingY: dy,
    distance,
  };
}

/** Is a position clear of every static obstacle, allowing for the bee footprint? */
export function isStaticClear(x, y, obstacles, radius, gap = 0) {
  return obstacles.every(obstacle => !obstacle.collidesWithCircle(x, y, radius, gap));
}

/** Check the entire segment, not just its end, to prevent cutting across trunks. */
export function isSegmentClear(from, to, obstacles, radius, gap = 0) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const samples = Math.max(1, Math.ceil(distance / 7));
  for (let i = 1; i <= samples; i += 1) {
    const t = i / samples;
    if (!isStaticClear(from.x + (to.x - from.x) * t,
      from.y + (to.y - from.y) * t, obstacles, radius, gap)) return false;
  }
  return true;
}

/** A tiny binary min-heap for A*; more efficient than re-sorting the frontier. */
class MinHeap {
  constructor() { this.items = []; }
  push(item) {
    const a = this.items;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= item.f) break;
      a[i] = a[p];
      i = p;
    }
    a[i] = item;
  }
  pop() {
    const a = this.items;
    if (!a.length) return null;
    const top = a[0];
    const last = a.pop();
    if (!a.length) return top;
    let i = 0;
    while ((i * 2 + 1) < a.length) {
      let c = i * 2 + 1;
      if (c + 1 < a.length && a[c + 1].f < a[c].f) c += 1;
      if (a[c].f >= last.f) break;
      a[i] = a[c];
      i = c;
    }
    a[i] = last;
    return top;
  }
  get length() { return this.items.length; }
}

/**
 * Compute a collision-free route around both circular trees and rectangular houses.
 * Uses a bounded A* grid only when straight-line pursuit is obstructed; routes are
 * re-used for many frames in Enemy.update instead of recalculated each frame.
 *
 * Returns a list of waypoints (possibly stopping near an unreachable target).
 */
export function findObstaclePath(from, target, obstacles, radius, gap = 0, options = {}) {
  const cell = options.cellSize ?? 20;
  const padding = options.padding ?? 140;
  const maxVisited = options.maxVisited ?? 3400;
  if (isSegmentClear(from, target, obstacles, radius, gap)) {
    return [{ x: target.x, y: target.y }];
  }

  // Include relevant obstructions; scenery far away cannot affect this route.
  const left = Math.min(from.x, target.x) - padding;
  const right = Math.max(from.x, target.x) + padding;
  const bottom = Math.min(from.y, target.y) - padding;
  const top = Math.max(from.y, target.y) + padding;
  const nearby = obstacles.filter(obstacle => {
    const x = obstacle.position.x;
    const y = obstacle.position.y;
    const margin = 110;
    return x >= left - margin && x <= right + margin && y >= bottom - margin && y <= top + margin;
  });

  const minI = Math.floor((left - from.x) / cell);
  const maxI = Math.ceil((right - from.x) / cell);
  const minJ = Math.floor((bottom - from.y) / cell);
  const maxJ = Math.ceil((top - from.y) / cell);
  const key = (i, j) => `${i},${j}`;
  const point = (i, j) => ({ x: from.x + i * cell, y: from.y + j * cell });
  const freeCache = new Map();
  function isFree(i, j) {
    if (i < minI || i > maxI || j < minJ || j > maxJ) return false;
    if (i === 0 && j === 0) return true;
    const k = key(i, j);
    if (!freeCache.has(k)) {
      const p = point(i, j);
      freeCache.set(k, isStaticClear(p.x, p.y, nearby, radius, gap));
    }
    return freeCache.get(k);
  }

  const heuristic = (i, j) => {
    const p = point(i, j);
    return Math.hypot(p.x - target.x, p.y - target.y);
  };
  const open = new MinHeap();
  const parent = new Map();
  const bestG = new Map([[key(0, 0), 0]]);
  open.push({ i: 0, j: 0, g: 0, f: heuristic(0, 0) });
  const steps = [[1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1]];
  let goalNode = null;
  let closestNode = { i: 0, j: 0 };
  let closestDistance = heuristic(0, 0);
  let visited = 0;

  while (open.length && visited < maxVisited) {
    const current = open.pop();
    const currentKey = key(current.i, current.j);
    if (current.g > (bestG.get(currentKey) ?? Infinity) + 1e-6) continue;
    visited += 1;
    const currentPoint = point(current.i, current.j);
    const d = heuristic(current.i, current.j);
    if (d < closestDistance) {
      closestNode = current;
      closestDistance = d;
    }
    if (d <= cell * 1.5 && isSegmentClear(currentPoint, target, nearby, radius, gap)) {
      goalNode = current;
      break;
    }
    // If the player is pressed against a tree, the larger bee may only be
    // able to approach the edge. Choose the closest reachable free grid node.
    if (d <= cell * 0.8) {
      goalNode = current;
      break;
    }
    for (const [di, dj] of steps) {
      const ni = current.i + di, nj = current.j + dj;
      if (!isFree(ni, nj)) continue;
      // Never cut corners diagonally through two touching obstacles.
      if (di && dj && (!isFree(current.i + di, current.j) ||
          !isFree(current.i, current.j + dj))) continue;
      const nk = key(ni, nj);
      const ng = current.g + Math.hypot(di, dj) * cell;
      if (ng + 1e-8 >= (bestG.get(nk) ?? Infinity)) continue;
      bestG.set(nk, ng);
      parent.set(nk, currentKey);
      open.push({ i: ni, j: nj, g: ng, f: ng + heuristic(ni, nj) });
    }
  }

  const endpoint = goalNode ?? closestNode;
  if (endpoint.i === 0 && endpoint.j === 0) return [];
  const reversed = [];
  let cursor = key(endpoint.i, endpoint.j);
  while (cursor !== key(0, 0) && reversed.length <= maxVisited) {
    const [i, j] = cursor.split(',').map(Number);
    reversed.push(point(i, j));
    cursor = parent.get(cursor);
    if (!cursor) return [];
  }
  const raw = reversed.reverse();
  if (isSegmentClear(raw.at(-1), target, nearby, radius, gap)) {
    raw.push({ x: target.x, y: target.y });
  }

  // Path smoothing: use the furthest *actually visible* waypoint, while
  // retaining clearance from trunks and house corners.
  const smoothed = [];
  let previous = { x: from.x, y: from.y };
  let index = 0;
  while (index < raw.length) {
    let furthest = index;
    for (let j = index + 1; j < raw.length; j += 1) {
      if (isSegmentClear(previous, raw[j], nearby, radius, gap)) furthest = j;
    }
    smoothed.push(raw[furthest]);
    previous = raw[furthest];
    index = furthest + 1;
  }
  return smoothed;
}
