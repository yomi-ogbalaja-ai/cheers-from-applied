const STORAGE_KEY = "cheer_session_id";

// A stable anonymous id for this browser, used only to dedupe repeat views
// of the same celebration board — never sent anywhere else, never tied to
// an identity.
export function getSessionId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
