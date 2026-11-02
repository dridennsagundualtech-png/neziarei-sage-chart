/** Phone-only features (Android app). Everything here is a no-op in a browser. */
import { Capacitor } from "@capacitor/core";

export const isNative = () => Capacitor.isNativePlatform();

export async function startNative() {
  if (!isNative()) return;
}
