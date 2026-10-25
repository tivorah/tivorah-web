/** "Used, good", "Like new", "New" for an item's condition (shared by server and client pages). */
export const conditionLabel = (value?: string | null) => value ? value.replace("used_", "Used, ").replace("like_new", "Like new").replaceAll("_", " ").replace(/^new$/, "New") : null;
