/**
 * Safely evaluates a basic mathematical expression from a string.
 * Supports: +, -, *, /, decimals.
 * Prevents: eval() and dangerous characters.
 */
export function evaluateMath(input: string): number | null {
    if (!input || !input.trim()) return null;

    // 1. Sanitize: Only allow digits, decimals, and basic operators
    // Also allow 'x' as a multiplication alias
    const sanitized = input.replace(/x/g, '*').replace(/[^-0-9+*/().]/g, '');

    if (!sanitized) return null;

    try {
        // We use a basic logic to evaluate without eval()
        // For a "tiny" and "safe" parser using regex, we can use 
        // a series of reductions or a simple recursive descent.
        // For this UX, a simple reduction for DMAS is effective.

        let expr = sanitized;

        // Helper to solve binary operations
        const solve = (e: string, operators: string[]): string => {
            const regex = new RegExp(`(-?\\d+\\.\\d+|-?\\d+)([\\${operators.join('\\')}])(-?\\d+\\.\\d+|-?\\d+)`);
            while (regex.test(e)) {
                e = e.replace(regex, (_, n1, op, n2) => {
                    const a = parseFloat(n1);
                    const b = parseFloat(n2);
                    switch (op) {
                        case '*': return (a * b).toString();
                        case '/': return b !== 0 ? (a / b).toString() : "0";
                        case '+': return (a + b).toString();
                        case '-': return (a - b).toString();
                        default: return "0";
                    }
                });
            }
            return e;
        };

        // Order of operations: * / then + -
        expr = solve(expr, ['*', '/']);
        expr = solve(expr, ['+', '-']);

        const result = parseFloat(expr);
        return isFinite(result) ? result : null;
    } catch (err) {
        console.error("Math evaluation failed", err);
        return null;
    }
}
