// Light or dark for the web, matching the app. The app adds ?theme=dark|light to the pages it
// opens (the in-app browser can't see the app's own setting); the choice is kept for that tab.
// Opened directly, the page follows the phone's setting. app/theme-dark.css holds the dark colours.
export const THEME_KEY = "tivorah-theme";

/** Runs in <head> before the page paints, so a dark page never flashes light. Kept tiny, no imports. */
export const themeBootScript = `(function(){try{var d=document.documentElement,k="${THEME_KEY}",q=new URLSearchParams(location.search).get("theme"),s=null;if(q==="dark"||q==="light"){sessionStorage.setItem(k,q);s=q}else{s=sessionStorage.getItem(k)}var m=window.matchMedia("(prefers-color-scheme: dark)");var apply=function(){d.setAttribute("data-theme",s||(m.matches?"dark":"light"))};apply();if(!s&&m.addEventListener)m.addEventListener("change",apply)}catch(e){}})();`;

/** "dark" or "light" from a ?theme= value, anything else is ignored. */
export const themeFromQuery = (value: string | null) => (value === "dark" || value === "light" ? value : null);
