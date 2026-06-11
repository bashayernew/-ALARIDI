/**
 * Runs before paint to set the initial theme and avoid a flash.
 * Default: dark on the storefront, light on /admin. A saved per-area
 * preference (localStorage) overrides the default.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var p=location.pathname||"";
var area=p.indexOf("/admin")===0?"admin":"site";
var s=localStorage.getItem("alaridi-theme:"+area);
var t=(s==="light"||s==="dark")?s:(area==="admin"?"light":"dark");
var d=document.documentElement;
d.classList.toggle("dark",t==="dark");
d.style.colorScheme=t;
}catch(e){}})();`;
