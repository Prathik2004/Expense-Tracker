/**
 * Utility functions for triggering native-feeling haptic feedback via the Web Vibration API.
 * 
 * Safely checks for browser support (e.g., handles iOS Safari gracefully where it's unsupported).
 * 
 * Pattern Guide:
 * - Light: Micro-interactions (swipes, dragging, toggles).
 * - Success: Affirmative actions (saving, completing a form).
 * - Warning: Destructive or error states (deleting, limits reached).
 */

const isSupported = () => typeof navigator !== 'undefined' && 'vibrate' in navigator;

/**
 * A tiny tick. Used for purely physical interaction feedback like sliding or snapping.
 */
export const hapticLight = () => {
    if (!isSupported()) return;
    try {
        navigator.vibrate(10);
    } catch (e) {
        // Ignore errors if vibration is blocked by user settings or permissions
    }
};

/**
 * A satisfying double-pulse. Used when an action successfully completes.
 */
export const hapticSuccess = () => {
    if (!isSupported()) return;
    try {
        navigator.vibrate([15, 50, 15]);
    } catch (e) {
        // Ignore errors
    }
};

/**
 * A heavy, long buzz. Used before destructive actions or to indicate a hard error/limit.
 */
export const hapticWarning = () => {
    if (!isSupported()) return;
    try {
        navigator.vibrate([50, 100, 50]);
    } catch (e) {
        // Ignore errors
    }
};
