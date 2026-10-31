/** Where the theme toggle keeps the visitor's choice. Without a stored choice the site follows the system setting. */
export const THEME_KEY = "theme";

/**
 * Runs in <head> before the first paint and puts a stored choice on <html> as data-theme, so a page never
 * flashes in the other mode. The server can't do it: the choice lives in the browser and pages are cached.
 */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
