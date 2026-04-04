import * as THREE from 'three';
import { type ExitMarker, type ExitSubtype, type NavGraph, type NavNode, nearestNode, EYE_HEIGHT } from './navGraph';

// ---------------------------------------------------------------------------
// A* Pathfinding
// ---------------------------------------------------------------------------

interface AStarNode {
  id: number;
  g: number; // cost from start
  f: number; // g + heuristic
  parent: AStarNode | null;
}

/**
 * Run A* from startNode to goalNode on the NavGraph.
 * Returns an ordered array of NavNodes forming the shortest path,
 * or null if no path exists.
 */
export function aStar(
  graph: NavGraph,
  startId: number,
  goalId: number
): NavNode[] | null {
  const heuristic = (id: number) =>
    graph.nodes[id].position.distanceTo(graph.nodes[goalId].position);

  const open = new Map<number, AStarNode>();
  const closed = new Set<number>();

  const startNode: AStarNode = { id: startId, g: 0, f: heuristic(startId), parent: null };
  open.set(startId, startNode);

  while (open.size > 0) {
    // Pick node with lowest f
    let current: AStarNode | null = null;
    for (const node of open.values()) {
      if (!current || node.f < current.f) current = node;
    }
    if (!current) break;

    if (current.id === goalId) {
      // Reconstruct path
      const path: NavNode[] = [];
      let n: AStarNode | null = current;
      while (n) { path.unshift(graph.nodes[n.id]); n = n.parent; }
      return path;
    }

    open.delete(current.id);
    closed.add(current.id);

    for (const { to, cost } of graph.adjacency.get(current.id) ?? []) {
      if (closed.has(to)) continue;
      const g = current.g + cost;
      const existing = open.get(to);
      if (!existing || g < existing.g) {
        open.set(to, { id: to, g, f: g + heuristic(to), parent: current });
      }
    }
  }

  return null; // no path found
}

// ---------------------------------------------------------------------------
// Convenience: find path between two world positions
// ---------------------------------------------------------------------------

/**
 * Find the nearest reachable exit by actual path cost (A*), not straight-line distance.
 * Returns both the exit and the path so you don't have to run A* twice.
 */
export function nearestReachableExit(
  graph: NavGraph,
  exits: ExitMarker[],
  fromPosition: THREE.Vector3,
  subtype?: ExitSubtype
): { exit: ExitMarker; path: THREE.Vector3[] } | null {
  // Use y-tolerance to prefer nodes on the same floor level
  const yTolerance = 1.5; // Allow some tolerance for floor level variations
  const startNode = nearestNode(graph, fromPosition, yTolerance);
  if (!startNode) return null;

  const candidates = subtype ? exits.filter(e => e.subtype === subtype) : exits;

  let bestResult: { exit: ExitMarker; path: THREE.Vector3[] } | null = null;
  let bestCost = Infinity;

  for (const exit of candidates) {
    const nodePath = aStar(graph, startNode.id, exit.nearestNodeId);
    if (!nodePath) continue; // unreachable — skip entirely

    // Cost is the sum of edge distances in the node path
    let cost = 0;
    for (let i = 1; i < nodePath.length; i++) {
      cost += nodePath[i].position.distanceTo(nodePath[i - 1].position);
    }

    if (cost < bestCost) {
      bestCost = cost;
      const floorStartPosition = fromPosition.clone();
      floorStartPosition.y -= EYE_HEIGHT;
      bestResult = {
        exit,
        path: [
          floorStartPosition, // Include segment from player's position to nearest map node
          ...nodePath.map(n => n.position.clone()),
          exit.position.clone(),
        ],
      };
    }
  }

  return bestResult;
}

// ---------------------------------------------------------------------------
// Three.js visualisation (optional — call this to draw the path in your scene)
// ---------------------------------------------------------------------------

/**
 * Creates a THREE.Line object from a path array.
 * Add the returned object to your scene; remove/replace it on each new query.
 *
 * Usage:
 *   const line = buildPathLine(path, 0x00ff44);
 *   scene.add(line);
 */
export function buildPathLine(
  path: THREE.Vector3[],
  color = 0x00ff44
): THREE.Line {
  const geo = new THREE.BufferGeometry().setFromPoints(path);
  const mat = new THREE.LineBasicMaterial({ color, linewidth: 2, depthTest: true });
  const line = new THREE.Line(geo, mat);
  line.renderOrder = 1; // Draw after most objects but before UI
  line.visible = true; // Make visible by default for path display
  return line;
}
