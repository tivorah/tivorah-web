"use client";
import { useCallback } from "react";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { MAX_MENU_ITEMS, menuItemId, type MenuDraftItem, type ServiceMenuValue, type ServiceTemplate } from "../../lib/service-menu";
import { moveItem, useSortable } from "../ui/use-sortable";
import "./service-menu-editor.css";

// Category templates come from the API: a few categories (food, hairstyles, packages) ask the
// provider what's on their list; customers then pick from it when they book a time. Any other
// category keeps the default booking, so nothing extra shows.
export function useServiceTemplate(category: string | null | undefined): ServiceTemplate | null {
  const { data } = usePrivateResource<{ templates: Record<string, ServiceTemplate> }>("/market/service-templates");
  return (category && data?.templates[category]) || null;
}

export function ServiceMenuEditor({ template, value, onChange, disabled }: { template: ServiceTemplate; value: ServiceMenuValue; onChange: (value: ServiceMenuValue) => void; disabled?: boolean }) {
  const setItem = (id: string, patch: Partial<MenuDraftItem>) => onChange(value.map((item) => item.id === id ? { ...item, ...patch } : item));
  const addItem = () => onChange([...value, { id: menuItemId("item"), name: "", description: "", price: "" }].slice(0, MAX_MENU_ITEMS));
  const onMove = useCallback((from: number, to: number) => onChange(moveItem(value, from, to)), [onChange, value]);
  const sort = useSortable({ count: value.length, onMove, describe: useCallback((index: number) => value[index]?.name || `Item ${index + 1}`, [value]) });

  return <div className="menu-editor">
    <div>
      <h3 className="menu-editor-question">{template.menuQuestion}</h3>
      <p className="showcase-hint">{template.menuHint} Leave it empty to take bookings at one price instead.</p>
    </div>
    {value.length ? <ol className="showcase-sort-list menu-editor-list" ref={sort.listRef} aria-label={`${template.menuLabel} items`}>
      {value.map((item, index) => <li key={item.id} className="showcase-sort-row menu-editor-row" {...sort.itemProps(index)}>
        <button type="button" className="showcase-sort-handle" disabled={disabled} {...sort.handleProps(index)}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" /></svg>
        </button>
        <span className="menu-editor-fields">
          <input aria-label={`Item ${index + 1} name`} placeholder={index === 0 ? template.itemPlaceholder : "Item name"} value={item.name} maxLength={80} disabled={disabled} onChange={(event) => setItem(item.id, { name: event.target.value })} />
          <span className="menu-editor-price"><span aria-hidden="true">$</span><input aria-label={`Item ${index + 1} price`} inputMode="decimal" placeholder="0.00" value={item.price} disabled={disabled} onChange={(event) => setItem(item.id, { price: event.target.value.replace(/[^\d.]/g, "") })} /></span>
          <input className="menu-editor-description" aria-label={`Item ${index + 1} description`} placeholder="Short description (optional)" value={item.description} maxLength={200} disabled={disabled} onChange={(event) => setItem(item.id, { description: event.target.value })} />
        </span>
        <button type="button" className="showcase-row-remove" aria-label={`Remove ${item.name || `item ${index + 1}`}`} disabled={disabled} onClick={() => onChange(value.filter((row) => row.id !== item.id))}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </li>)}
    </ol> : null}
    {value.length < MAX_MENU_ITEMS ? <button type="button" className="menu-editor-add" disabled={disabled} onClick={addItem}>+ Add {value.length ? "another" : "an item"}</button> : null}
    <p className="showcase-sr" aria-live="polite">{sort.announcement}</p>
  </div>;
}
