/**
 * Returns event-handler props for a virtual button that maps to a keyboard key.
 * Works with mouse and touch, and optionally auto-starts the game on first press.
 *
 * @param {string} key          – The keyboard key to simulate (e.g. "ArrowLeft", " ")
 * @param {React.MutableRefObject<Object>} keysRef – Ref to the mutable keys map
 * @param {Object}  [opts]
 * @param {React.MutableRefObject<Object>} [opts.gameRef]  – Ref to the game state object
 * @param {Function} [opts.onStart] – Called when the game transitions from IDLE → RUNNING
 */
export function useButtonPress(key, keysRef, { gameRef, onStart } = {}) {
  const press = () => {
    keysRef.current[key] = true;
    if (gameRef?.current?.status === "IDLE") {
      gameRef.current.status = "RUNNING";
      onStart?.();
    }
  };
  const release = () => {
    keysRef.current[key] = false;
  };
  return {
    onMouseDown: press,
    onMouseUp: release,
    onMouseLeave: release,
    onTouchStart: (e) => { e.preventDefault(); press(); },
    onTouchEnd: (e) => { e.preventDefault(); release(); },
  };
}
