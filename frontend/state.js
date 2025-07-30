// 📁 js/state.js

let sessionId = crypto.randomUUID();

export function getSessionId() {
  return sessionId;
}

export function resetSessionId() {
  sessionId = crypto.randomUUID();
}
