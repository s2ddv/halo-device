/** Lovable's embedded preview must never register a worker. SSR never touches browser globals. */
export function registerPwa() {
  if (
    !import.meta.env.PROD ||
    typeof window === "undefined" ||
    window.self !== window.top ||
    !window.isSecureContext ||
    !("serviceWorker" in navigator)
  )
    return;
  void navigator.serviceWorker
    .register("/sw.js", { scope: "/", updateViaCache: "none" })
    .catch((error: unknown) =>
      console.warn("Halo: não foi possível habilitar o modo offline.", error),
    );
}
