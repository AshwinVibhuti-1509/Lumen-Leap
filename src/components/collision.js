import * as THREE from 'three';

/**
 * Approximate a round collision footprint using transformed mesh VERTICES.
 * Unlike Box3 bounding-box sizes, this uses the actual geometry in the XY plane.
 * The 70th-percentile body radius avoids allowing long decorative appendages
 * to act as invisible walls. A gameplay radius cap keeps models playable.
 */
export function measureFootprint(model, localRoot, { minRadius = 5, maxRadius = 20 } = {}) {
  localRoot.updateWorldMatrix(true, true);
  const inverse = localRoot.matrixWorld.clone().invert();
  const points = [];
  const vertex = new THREE.Vector3();
  const relativeTransform = new THREE.Matrix4();

  model.traverse((mesh) => {
    if (!mesh.isMesh || !mesh.geometry?.attributes?.position) return;
    relativeTransform.multiplyMatrices(inverse, mesh.matrixWorld);
    const positions = mesh.geometry.attributes.position;
    // Sampling large models keeps this calculation inexpensive on slower laptops.
    const stride = Math.max(1, Math.floor(positions.count / 8000));
    for (let i = 0; i < positions.count; i += stride) {
      vertex.fromBufferAttribute(positions, i).applyMatrix4(relativeTransform);
      points.push({ x: vertex.x, y: vertex.y });
    }
  });

  if (points.length === 0) {
    return { centerX: 0, centerY: 0, radius: minRadius };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const { x, y } of points) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const distances = points.map(({ x, y }) => Math.hypot(x - centerX, y - centerY));
  distances.sort((a, b) => a - b);
  const middleBodyRadius = distances[Math.floor((distances.length - 1) * 0.7)];
  const radius = Math.max(minRadius, Math.min(maxRadius, middleBodyRadius));
  return { centerX, centerY, radius };
}

/** Check 2D XY collision circles, with extra space between characters. */
export function circlesOverlap(aX, aY, aRadius, bX, bY, bRadius, minimumGap = 0) {
  return Math.hypot(aX - bX, aY - bY) < aRadius + bRadius + minimumGap;
}
