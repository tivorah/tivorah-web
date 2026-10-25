import type { ShopContent } from "./shop/types";

/**
 * What each kind of listing is for, in the seller's words, so nobody wonders where something goes:
 *   • an item is something people BUY: products, crafts, and food, including ready-made dishes
 *     (ready or delivered within a set time, e.g. 30 minutes);
 *   • a service is something you DO or that's BOOKED FOR LATER: appointments, lessons, and catering
 *     or a private chef for a date.
 * Wording follows the seller's shop type when they have one (shop/templates.ts).
 * Mobile mirrors this in tivorah-mobile/utils/listingKinds.ts.
 */
export type ListingKind = "item" | "service" | "event";
type BusinessType = NonNullable<ShopContent["businessType"]>;

/** Categories sold new by nature: no "condition" question. */
export const CONSUMABLE_CATEGORIES = ["Food & groceries", "Meals & takeaway"];
export const asksCondition = (category: string) => !CONSUMABLE_CATEGORIES.includes(category);

export function createCopy(kind: ListingKind, businessType?: BusinessType | null): { title: string; intro: string; hint?: { text: string; href: string; link: string } } {
  if (kind === "event") return { title: "Create an event", intro: "Set the details, place and tickets. Your event is saved as a draft so you can review it before publishing." };
  if (kind === "service") {
    if (businessType === "food") return { title: "Offer catering", intro: "For food booked for a date: event catering, a private chef or a custom cake. Dishes people order now go on your menu as items.", hint: { text: "Selling dishes people order now?", href: "/business/create?type=item", link: "Add a dish to your menu" } };
    if (businessType === "beauty") return { title: "Add a treatment", intro: "Add each treatment or style with its price, where you work and when customers can book." };
    if (businessType === "tutoring") return { title: "Add a lesson", intro: "Explain what you teach, where lessons happen and when students can book." };
    return { title: "Offer a service", intro: "For something you do or that’s booked for later: appointments, lessons, repairs, or catering for a date. Your service appears in your shop and on Tivorah Services." };
  }
  if (businessType === "food") return { title: "Add a dish", intro: "Add each dish with a photo and price, and say how long it takes to be ready or delivered. It appears on your shop’s Menu and on Tivorah Shop." };
  if (businessType === "drinks") return { title: "Add a drink", intro: "Add each drink with a photo, price and how people get it. It appears under your shop’s drinks and on Tivorah Shop." };
  return { title: "Sell an item", intro: "For things people buy: products, crafts, pre-loved goods, and food and drinks, including ready-made dishes. Add clear photos, a fair price and how people get it." };
}
