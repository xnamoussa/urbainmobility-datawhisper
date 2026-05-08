import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DEMO_STATIONS, DEMO_INCIDENTS, demoShortestPath } from "./demo-network";

const RouteInput = z.object({
  fromId: z.string().min(1).max(64),
  toId: z.string().min(1).max(64),
});

export const listStations = createServerFn({ method: "GET" }).handler(async () => {
  // En prod : MATCH (s:Station) RETURN s ORDER BY s.name
  return { stations: DEMO_STATIONS, source: "demo" as const };
});

export const computeRoute = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => RouteInput.parse(data))
  .handler(async ({ data }) => {
    // Dans Neo4j : gds.shortestPath.dijkstra.stream avec relationshipWeightProperty: 'temps_moyen'
    const result = demoShortestPath(data.fromId, data.toId);
    return { ...result, source: "demo" as const };
  });

export const listIncidents = createServerFn({ method: "GET" }).handler(async () => {
  // MATCH (i:Incident {status:'ACTIF'})-[:AFFECTE]->(l) RETURN ...
  return { incidents: DEMO_INCIDENTS, source: "demo" as const };
});

export const accessibilityScores = createServerFn({ method: "GET" }).handler(async () => {
  // MATCH (z:Zone) -[:WALK_TO]- (st:StopTime)-[:FOLLOWS*]->(d:Stop) ...
  // Score démo basé sur le nombre de lignes desservies
  const scored = DEMO_STATIONS.map((s) => ({
    id: s.id,
    name: s.name,
    zone: s.zone,
    score: Math.min(100, s.lines.length * 22 + (s.zone === 1 ? 30 : 10)),
    lines: s.lines,
  })).sort((a, b) => b.score - a.score);
  return { scored };
});
