import { useLocal } from "./storage";

/** planId -> list of completed day indexes */
export const usePlanProgress = () => useLocal<Record<string, number[]>>("sc.plans", {});
