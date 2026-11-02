import { useLocal } from "./storage";

export interface Intention {
  id: string;
  text: string;
  created: string; // YYYY-MM-DD
  answered?: boolean;
}

export const useIntentions = () => useLocal<Intention[]>("sc.intentions", []);
