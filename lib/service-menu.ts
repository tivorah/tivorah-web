// Service menus (API: tivorah-api/src/services/serviceMenu.ts, which serves the category templates at
// /market/service-templates). A few categories (food, hairstyles, packages) are booked from a list;
// every other category keeps the default booking. The API prices every booking from the stored menu.

/** Questions a menu category asks when creating a service, and its booking-form wording. */
export type ServiceTemplate = {
  menuLabel: string;
  menuQuestion: string;
  menuHint: string;
  itemPlaceholder: string;
  modeQuestion: string;
  modeLabels: Partial<Record<"at_provider" | "mobile" | "flexible" | "online", string>>;
  addressLabel: string;
};
export type ServiceMenuItem = { id: string; name: string; description?: string; priceCents: number };
/** An item while it's being edited: the price stays as typed until it's saved. */
export type MenuDraftItem = { id: string; name: string; description: string; price: string };
export type ServiceMenuValue = MenuDraftItem[];

export const MAX_MENU_ITEMS = 40;

export const menuItemId = (name: string) =>
  `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28) || "item"}-${Math.random().toString(36).slice(2, 8)}`;

export const draftFromMenu = (menu: ServiceMenuItem[] | undefined): ServiceMenuValue =>
  (menu ?? []).map((item) => ({ id: item.id, name: item.name, description: item.description ?? "", price: (item.priceCents / 100).toFixed(2) }));

/** What the API stores; only menu categories send items. Throws a friendly message for anything it would refuse. */
export function menuPayload(items: ServiceMenuValue, usesMenu: boolean): { serviceMenu: ServiceMenuItem[] } {
  if (!usesMenu) return { serviceMenu: [] };
  const serviceMenu = items.filter((item) => item.name.trim() || item.price.trim()).map((item, index) => {
    const name = item.name.trim();
    if (name.length < 2) throw new Error(`Give item ${index + 1} a name.`);
    const price = Number(item.price);
    if (item.price.trim() === "" || !Number.isFinite(price) || price < 0 || price > 100000) throw new Error(`Add a price for “${name}”.`);
    return { id: item.id, name, ...(item.description.trim() ? { description: item.description.trim() } : {}), priceCents: Math.round(price * 100) };
  });
  return { serviceMenu };
}

/** A filled-in row counts as a menu item (empty rows are ignored when saving). */
export const hasMenuItems = (items: ServiceMenuValue) => items.some((item) => item.name.trim() && item.price.trim());

/** Booking total for the picks shown before the server quote arrives (no fees). */
export const menuSubtotal = (menu: ServiceMenuItem[], picks: Record<string, number>) =>
  menu.reduce((sum, item) => sum + item.priceCents * (picks[item.id] ?? 0), 0);
