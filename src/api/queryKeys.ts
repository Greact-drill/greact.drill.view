export const queryKeys = {
  edges: {
    all: ["edges"] as const,
    byKey: (key: string) => ["edges", "byKey", key] as const,
    root: ["edges", "root"] as const,
    withAttributes: ["edges", "withAttributes"] as const,
    rootWithAttributes: ["edges", "rootWithAttributes"] as const,
    children: (edgeKey: string) => ["edges", "children", edgeKey] as const,
  },
  current: {
    details: (edgeKey: string) => ["current", "details", edgeKey] as const,
    tagsData: (edgeKey: string) => ["current", "tagsData", edgeKey] as const,
    scoped: (edgeId: string) => ["current", "scoped", edgeId] as const,
    byTags: (edgeId: string, tagIds: string[]) =>
      ["current", "byTags", edgeId, ...tagIds] as const,
  },
  history: {
    details: (edgeKey: string, mode: "realtime" | "single") =>
      ["history", "details", edgeKey, mode] as const,
  },
  widgets: {
    byEdge: (edgeId: string) => ["widgets", "byEdge", edgeId] as const,
    byPage: (page: string) => ["widgets", "byPage", page] as const,
  },
  customizations: {
    byEdge: (edgeId: string) => ["customizations", "byEdge", edgeId] as const,
  },
  tableConfig: {
    byPage: (page: string) => ["tableConfig", "byPage", page] as const,
  },
};
