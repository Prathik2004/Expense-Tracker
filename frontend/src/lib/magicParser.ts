import { evaluateMath } from "./mathParser";

/**
 * Parses a "magic" string into transaction components.
 * Format: "120 food office canteen" -> { amount: 120, category: "Food", description: "office canteen" }
 */
export function parseMagicInput(input: string, categories: string[]) {
    const parts = input.split(/\s+/).filter(Boolean);

    let amount = 0;
    let foundCategory = "";
    const descriptionParts: string[] = [];

    // 1. Find the first number or math expression (amount)
    // A math expression might look like "1500/3" or "450+120"
    const amountIndex = parts.findIndex(p => {
        // Check if it's a number or contains operators
        return !isNaN(Number(p)) || /[+*/-]/.test(p);
    });

    if (amountIndex !== -1) {
        const part = parts[amountIndex];
        const evaluated = evaluateMath(part);
        amount = evaluated !== null ? evaluated : (parseFloat(part) || 0);
        // Remove amount from parts to simplify remaining extraction
        parts.splice(amountIndex, 1);
    }

    // 2. Identify category by matching against known categories (case-insensitive)
    const lowerCategories = categories.map(c => c.toLowerCase());

    // Check each word if it matches a category
    const categoryIndex = parts.findIndex(p => lowerCategories.includes(p.toLowerCase()));

    if (categoryIndex !== -1) {
        // Find the actual case-sensitive category name
        const match = categories.find(c => c.toLowerCase() === parts[categoryIndex].toLowerCase());
        foundCategory = match || "Other";
        parts.splice(categoryIndex, 1);
    } else {
        // Try fallback matches (e.g., if input is "shopping" but category is "Shopping")
        foundCategory = "Other";
    }

    // 3. The rest is the description
    const description = parts.join(" ");

    return {
        amount: amount || 0,
        category: foundCategory || "Other",
        description: description || ""
    };
}
