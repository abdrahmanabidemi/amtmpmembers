import { useEffect } from "react";

/**
 * Custom React hook to close modals/dialogs when the Escape key is pressed.
 *
 * @param onEscape Callback to invoke when Escape is pressed
 * @param active Whether the modal/overlay is currently active
 */
export function useEscapeKey(onEscape: () => void, active: boolean = true) {
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onEscape();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onEscape, active]);
}
