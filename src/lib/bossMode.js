const state = { active: false };
const listeners = new Set();

export const isBossActive = () => state.active;

export function setBossActive(v) {
  const next = !!v;
  if (state.active === next) return;
  state.active = next;
  listeners.forEach((fn) => fn(next));
}

export function subscribeBoss(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
