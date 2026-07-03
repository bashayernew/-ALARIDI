/**
 * Runs before paint to set the initial theme and avoid a flash.
 * Default: warm light everywhere. A saved per-area preference (localStorage)
 * overrides the default. The storage key is versioned (v2) so the new light
 * default applies even to visitors who previously had the old dark default.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var p=location.pathname||"";
var area=p.indexOf("/admin")===0?"admin":"site";
var s=localStorage.getItem("alaridi-theme2:"+area);
var t=(s==="light"||s==="dark")?s:(area==="admin"?"light":"dark");
var d=document.documentElement;
d.classList.toggle("dark",t==="dark");
d.style.colorScheme=t;
}catch(e){}})();`;
