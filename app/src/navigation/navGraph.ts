import * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NavNode {
  id: number;
  position: THREE.Vector3;
}

export interface NavEdge {
  from: number;
  to: number;
  cost: number;
}

export interface NavGraph {
  nodes: NavNode[];
  edges: NavEdge[];
  /** Adjacency list: nodeId → list of { to, cost } */
  adjacency: Map<number, { to: number; cost: number }[]>;
}

export type ExitSubtype = 'hatch' | 'extract';

// Player's eye height above the ground, used for pathfinding and exit snapping
export const EYE_HEIGHT = 1.1;

export interface ExitMarker {
  label: string;
  subtype: ExitSubtype;
  position: THREE.Vector3;
  /** The nearest nav graph node — use this as the pathfinding goal */
  nearestNodeId: number;
  /** The source Three.js object from the GLTF scene */
  object: THREE.Object3D;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Traverse a loaded GLTF scene and extract both the nav graph and exit markers
 * in one pass.
 *
 * Usage:
 *   const gltf = await loader.loadAsync('map.glb');
 *   const { graph, exits } = extractNav(gltf);
 */
export function extractNav(
  gltf: GLTF,
  navPathFilter = /^paths$|^NavPaths$/i
): { graph: NavGraph; exits: ExitMarker[] } {
  const graph = extractNavGraph(gltf, navPathFilter);
  const exits = extractExits(gltf, graph);
  return { graph, exits };
}

// ---------------------------------------------------------------------------
// Nav graph extraction
// ---------------------------------------------------------------------------

export function extractNavGraph(gltf: GLTF, nameFilter = /^paths$|^NavPaths$/i): NavGraph {
  const positionKey = (v: THREE.Vector3) =>
    `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;

  const keyToId = new Map<string, number>();
  const nodes: NavNode[] = [];
  const edges: NavEdge[] = [];

  function getOrCreateNode(worldPos: THREE.Vector3): number {
    const key = positionKey(worldPos);
    if (keyToId.has(key)) return keyToId.get(key)!;
    const id = nodes.length;
    nodes.push({ id, position: worldPos.clone() });
    keyToId.set(key, id);
    return id;
  }

  gltf.scene.traverse((obj) => {
    const matchesSelf   = nameFilter.test(obj.name);
    const matchesParent = obj.parent ? nameFilter.test(obj.parent.name) : false;
    if (!matchesSelf && !matchesParent) return;
    if (!(obj instanceof THREE.Mesh) && !(obj instanceof THREE.LineSegments)) return;

    const mesh    = obj as THREE.Mesh;
    const geo     = mesh.geometry as THREE.BufferGeometry;
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    if (!posAttr) return;

    mesh.updateWorldMatrix(true, false);
    const mat = mesh.matrixWorld;

    const getWorldVert = (i: number): THREE.Vector3 =>
      new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i))
        .applyMatrix4(mat);

    if (geo.index) {
      const idx = geo.index;
      for (let i = 0; i < idx.count; i += 2) {
        const aId = getOrCreateNode(getWorldVert(idx.getX(i)));
        const bId = getOrCreateNode(getWorldVert(idx.getX(i + 1)));
        if (aId !== bId) {
          edges.push({ from: aId, to: bId, cost: nodes[aId].position.distanceTo(nodes[bId].position) });
        }
      }
    } else {
      for (let i = 0; i < posAttr.count; i += 2) {
        const aId = getOrCreateNode(getWorldVert(i));
        const bId = getOrCreateNode(getWorldVert(i + 1));
        if (aId !== bId) {
          edges.push({ from: aId, to: bId, cost: nodes[aId].position.distanceTo(nodes[bId].position) });
        }
      }
    }
  });

  const adjacency = new Map<number, { to: number; cost: number }[]>();
  for (const node of nodes) adjacency.set(node.id, []);
  for (const edge of edges) {
    adjacency.get(edge.from)!.push({ to: edge.to,   cost: edge.cost });
    adjacency.get(edge.to)!.push({   to: edge.from, cost: edge.cost });
  }

  console.log(`[NavGraph] ${nodes.length} nodes, ${edges.length} edges`);
  return { nodes, edges, adjacency };
}

// ---------------------------------------------------------------------------
// Exit marker extraction
// ---------------------------------------------------------------------------

/**
 * Finds all objects in the GLTF scene tagged with marker_type = 'exit' in
 * their userData (written by Blender Custom Properties → GLTF extras).
 * Each exit is snapped to its nearest nav graph node for pathfinding.
 */
export function extractExits(gltf: GLTF, graph: NavGraph): ExitMarker[] {
  const exits: ExitMarker[] = [];

  gltf.scene.traverse((obj) => {
    const ud = obj.userData as Record<string, string>;
    if (ud?.marker_type !== "exit") return;

    const position = new THREE.Vector3();
    obj.getWorldPosition(position);  // origin is the most reliable snap point

    const nearest = nearestNode(graph, position);
    if (!nearest) return;

    exits.push({
      label:         ud.marker_label ?? obj.name,
      subtype:       (ud.marker_subtype as ExitSubtype) ?? "extract",
      position,
      nearestNodeId: nearest.id,
      object:        obj,
    });
  });

  return exits;
}

// ---------------------------------------------------------------------------
// Spatial helpers
// ---------------------------------------------------------------------------

/** Find the NavNode closest to a world position (for snapping player/goal). */
export function nearestNode(graph: NavGraph, worldPos: THREE.Vector3, yTolerance?: number): NavNode {
  // First, try to find nodes on the same floor level (within yTolerance)
  if (yTolerance !== undefined) {
    let best = null;
    let bestDist = Infinity;
    for (const node of graph.nodes) {
      const yDiff = Math.abs(node.position.y - worldPos.y + EYE_HEIGHT);
      if (yDiff <= yTolerance) {
        const d = node.position.distanceToSquared(worldPos);
        if (d < bestDist) { bestDist = d; best = node; }
      }
    }
    if (best) return best;
  }

  // If no nodes found on same floor (or no yTolerance specified), search all nodes
  let best = graph.nodes[0];
  let bestDist = Infinity;
  for (const node of graph.nodes) {
    const d = node.position.distanceToSquared(worldPos);
    if (d < bestDist) { bestDist = d; best = node; }
  }
  return best;
}

/**
 * Find the nearest exit by straight-line distance (fast, no pathfinding).
 * Good for HUD 'nearest exit' hints; use findPath() from pathfinding.ts for routing.
 */
export function nearestExit(
  exits: ExitMarker[],
  worldPos: THREE.Vector3,
  subtype?: ExitSubtype
): ExitMarker | null {
  const candidates = subtype ? exits.filter(e => e.subtype === subtype) : exits;
  if (!candidates.length) return null;
  let best = candidates[0];
  let bestDist = Infinity;
  for (const exit of candidates) {
    const d = exit.position.distanceToSquared(worldPos);
    if (d < bestDist) { bestDist = d; best = exit; }
  }
  return best;
}
