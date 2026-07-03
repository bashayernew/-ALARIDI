const base = process.env.BASE_URL || "http://localhost:3005";

const routes = [
  "/",
  "/menu",
  "/gifts",
  "/occasions",
  "/promotions",
  "/loyalty",
  "/about",
  "/contact",
  "/search",
  "/login",
  "/admin/products",
];

const homeMarkers = [
  ["hero carousel dots", "Go to slide"],
  ["hero prev arrow", "Previous slide"],
  ["hero kunafa image", "/kunafa.jpg"],
  ["features assorted image", "/assorted.jpg"],
  ["gallery mafrooke", "/mafrooke.jpg"],
  ["category panel frame", "rounded-[2rem] border border-primary/15"],
  ["header overlay gradient", "from-[#0c0803]/85"],
  ["starfield", "starfield"],
  ["mobile nav menu icon", "lucide-menu"],
];

async function fetchText(path, headers = {}) {
  const res = await fetch(`${base}${path}`, { redirect: "follow", headers });
  return { status: res.status, html: await res.text() };
}

async function main() {
  const routeResults = [];
  for (const path of routes) {
    try {
      const { status, html } = await fetchText(path);
      routeResults.push({
        path,
        status,
        pass: status === 200,
        errorSnippet: status !== 200 ? html.slice(0, 200) : undefined,
      });
    } catch (e) {
      routeResults.push({ path, pass: false, error: String(e) });
    }
  }

  const { html: home } = await fetchText("/");
  const homeSections = homeMarkers.map(([name, needle]) => ({
    name,
    pass: home.includes(needle),
  }));

  const { html: menu } = await fetchText("/menu");
  const headerChecks = {
    homeOverlayGradient: home.includes("from-[#0c0803]/85"),
    menuSolidHeader: menu.includes("backdrop-blur-xl"),
    menuNoHeroGradient: !menu.includes("from-[#0c0803]/85"),
  };

  const { html: arHome } = await fetchText("/", { cookie: "locale=ar" });
  const rtlCheck = {
    pass: arHome.includes('dir="rtl"'),
  };

  const mobileNavSource = [
    "AL ARIDI",
    "nav.home",
    "LanguageToggle",
    "ThemeToggle",
    "overflow-y-auto",
    "Escape",
    "document.body.style.overflow",
  ];

  console.log(
    JSON.stringify(
      { routeResults, homeSections, headerChecks, rtlCheck, mobileNavCodeChecks: "see component" },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
