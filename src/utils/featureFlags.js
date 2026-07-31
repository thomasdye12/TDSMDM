const V2_STORAGE_KEY = "tdsmdm.ui.v2";
const V2_ENABLE_KEY = "2026";

export function isV2UiEnabled() {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  const ui = params.get("ui");
  const v2 = params.get("v2");
  const key = params.get("tdsmdm_v2");

  if (ui === "classic" || v2 === "0") {
    window.localStorage.removeItem(V2_STORAGE_KEY);
    return false;
  }

  if (ui === "v2" || v2 === "1" || key === V2_ENABLE_KEY) {
    window.localStorage.setItem(V2_STORAGE_KEY, "1");
    return true;
  }

  return window.localStorage.getItem(V2_STORAGE_KEY) !== "0";
}

export function disableV2Ui() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(V2_STORAGE_KEY, "0");
}
