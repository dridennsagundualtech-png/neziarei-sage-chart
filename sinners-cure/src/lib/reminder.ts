import { useEffect } from "react";
import { dateKey } from "./liturgy";
import { readLocal, writeLocal } from "./storage";
import { toast } from "./share";

const MESSAGES = {
  readings: "Today's Mass readings are waiting for you.",
  rosary: "A gentle reminder: pray the Rosary today.",
  prayer: "Take a quiet moment with God.",
} as const;

/** Fires once a day at the chosen time while the app is open (no server needed). */
export function useReminder(time: string, kind: keyof typeof MESSAGES) {
  useEffect(() => {
    if (!time) return;
    const check = () => {
      const now = new Date();
      const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const today = dateKey(now);
      if (hm < time || readLocal<string>("sc.reminded", "") === today) return;
      writeLocal("sc.reminded", today);
      const msg = MESSAGES[kind];
      if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("Sinner's Cure", { body: msg, icon: "/favicon.ico" });
      else toast(msg);
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [time, kind]);
}
