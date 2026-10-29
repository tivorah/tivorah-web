// Light or dark for the web. The site is light unless someone chooses otherwise:
// 1. Opened from the app, the page matches the app: the app adds ?theme=dark|light (the in-app
//    browser can't see the app's own setting), kept for that tab.
// 2. Otherwise the choice from the toggle on the account dashboard, kept on this browser.
// 3. Otherwise light. The phone's own light/dark setting is not followed.
// app/theme-dark.css holds the dark colours.
export type Theme = "light" | "dark";
/** This tab's theme from the app (sessionStorage). */
export const THEME_KEY = "tivorah-theme";
/** The account dashboard toggle's choice (localStorage). */
export const SAVED_THEME_KEY = "tivorah-theme-choice";
/** Set by the handoff for a tab the app opened (lib/app-return.ts OPENED_FROM_APP_KEY). */
const IN_APP_KEY = "tivorah-opened-from-app";
/** Browser bar colour per theme (the page background). */
export const THEME_BAR_COLOURS: Record<Theme, string> = { light: "#fbf9f5", dark: "#151217" };

const asTheme = (value: unknown): Theme | null => (value === "dark" || value === "light" ? value : null);

/** "dark" or "light" from a ?theme= value, anything else is ignored. */
export const themeFromQuery = (value: string | null) => asTheme(value);

/** The order the pre-paint script follows: the app's theme for this tab, then the saved choice, then light. */
export function resolveTheme({ query, tab, saved }: { query?: string | null; tab?: string | null; saved?: string | null }): Theme {
  return asTheme(query) ?? asTheme(tab) ?? asTheme(saved) ?? "light";
}

/**
 * Runs in <head> before the page paints, so a dark page never flashes light. Kept tiny, no imports.
 * In dark it also paints the page colour on <html> itself, so the browser's blank canvas is already
 * dark before the stylesheets arrive (the in-app browser otherwise shows white for a moment).
 * Inside the Tivorah app (its WebView adds "TivorahApp" to the user agent, or the handoff marked the
 * tab) it adds data-in-app, so app/mobile-app.css can size the page like the app.
 */
export const themeBootScript = `(function(){try{var d=document.documentElement,k="${THEME_KEY}",c="${SAVED_THEME_KEY}",v=function(x){return x==="dark"||x==="light"?x:null},q=v(new URLSearchParams(location.search).get("theme")),t=null,s=null;try{if(q)sessionStorage.setItem(k,q);t=v(sessionStorage.getItem(k))}catch(e){}try{s=v(localStorage.getItem(c))}catch(e){}var m=q||t||s||"light";d.setAttribute("data-theme",m);var b=m==="dark"?"${THEME_BAR_COLOURS.dark}":"${THEME_BAR_COLOURS.light}";d.style.colorScheme=m;if(m==="dark")d.style.backgroundColor=b;var u=function(){var n=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<n.length;i++)n[i].setAttribute("content",b)};u();document.addEventListener("DOMContentLoaded",u)}catch(e){}try{var a=/TivorahApp/.test(navigator.userAgent)||new URLSearchParams(location.search).get("fromApp")==="1";try{a=a||sessionStorage.getItem("${IN_APP_KEY}")==="1"}catch(e){}if(a)document.documentElement.setAttribute("data-in-app","")}catch(e){}})();`;

/** The theme the page is showing now. */
export function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return asTheme(document.documentElement.getAttribute("data-theme")) ?? "light";
}

/**
 * The account dashboard toggle: show it now and keep it on this browser. It also replaces a theme the
 * app set for this tab, so the page doesn't switch back on the next link.
 */
export function chooseTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  // Replace the colour the pre-paint script put on <html>, or the old theme's background would stay.
  document.documentElement.style.colorScheme = theme;
  document.documentElement.style.backgroundColor = theme === "dark" ? THEME_BAR_COLOURS.dark : "";
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", THEME_BAR_COLOURS[theme]));
  try { sessionStorage.removeItem(THEME_KEY); } catch { /* storage blocked: still shown for this page */ }
  try { localStorage.setItem(SAVED_THEME_KEY, theme); } catch { /* storage blocked: still shown for this page */ }
}
