/**
 * Parses a "magic" string into transaction components.
 * Format: "120 food office canteen" -> { amount: 120, category: "Food", description: "office canteen" }
 */
export function parseMagicInput(input: string, categories: string[]) {
    const parts = input.split(/\s+/).filter(Boolean);

    let amount = 0;
    let foundCategory = "";
    const descriptionParts: string[] = [];

    // 1. Find the first number (amount)
    const amountIndex = parts.findIndex(p => !isNaN(Number(p)));
    if (amountIndex !== -1) {
        amount = parseFloat(parts[amountIndex]);
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
