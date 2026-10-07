"use client";

/**
 * Payment methods a seller can offer at Stripe Checkout (mirrors CHECKOUT_METHODS on the API).
 * Card is always on and carries Apple Pay and Google Pay; the others are optional.
 */
export type CheckoutMethod = "card" | "link" | "afterpay_clearpay" | "klarna" | "zip";

const OPTIONAL_METHODS: { id: Exclude<CheckoutMethod, "card">; label: string; detail: string }[] = [
  { id: "link", label: "Link", detail: "Stripe’s one-tap saved payment details" },
  { id: "afterpay_clearpay", label: "Afterpay", detail: "Pay in 4 instalments" },
  { id: "klarna", label: "Klarna", detail: "Pay later or in instalments" },
  { id: "zip", label: "Zip", detail: "Buy now, pay later" },
];

/** Card first, then the chosen optional methods in a stable order, as the API expects. */
export function orderedCheckoutMethods(selected: readonly CheckoutMethod[]): CheckoutMethod[] {
  return ["card", ...OPTIONAL_METHODS.map(option => option.id).filter(id => selected.includes(id))];
}

/** Stripe's recommended set (null) or card plus the optional methods the seller picks. */
export function CheckoutMethodsChooser({ name, value, available, onChange, disabled = false }: {
  /** Unique radio-group name, so two choosers can share a page. */
  name: string;
  value: CheckoutMethod[] | null;
  available: readonly CheckoutMethod[];
  onChange: (next: CheckoutMethod[] | null) => void;
  disabled?: boolean;
}) {
  const toggle = (id: CheckoutMethod, on: boolean) => {
    const current = value ?? ["card"];
    onChange(orderedCheckoutMethods(on ? [...current, id] : current.filter(method => method !== id)));
  };
  return <fieldset className="checkout-methods" disabled={disabled}>
    <legend className="checkout-methods-sr">Payment methods buyers can use</legend>
    <div className="payouts-checkout-choice">
      <label className="product-checkbox"><input type="radio" name={name} checked={value === null} onChange={() => onChange(null)} /><span>Recommended by Stripe</span></label>
      <label className="product-checkbox"><input type="radio" name={name} checked={value !== null} onChange={() => onChange(value ?? ["card"])} /><span>Choose methods</span></label>
    </div>
    {value ? <div className="payouts-method-options">
      <label className="product-checkbox"><input type="checkbox" checked disabled /><span>Card <small>· always on, includes Apple Pay and Google Pay</small></span></label>
      {OPTIONAL_METHODS.map(option => {
        const offered = available.includes(option.id);
        return <label className="product-checkbox" key={option.id}>
          <input type="checkbox" checked={offered && value.includes(option.id)} disabled={!offered} onChange={event => toggle(option.id, event.target.checked)} />
          <span>{option.label} <small>· {offered ? option.detail : "not available on Tivorah yet"}</small></span>
        </label>;
      })}
    </div> : null}
    <p className="checkout-methods-note">Stripe may hide a method when the currency or amount isn’t eligible. Changes apply to new checkouts.</p>
  </fieldset>;
}
