const ts = require("typescript");
const fs = require("fs");
const files = [
  "components/gifts/gifts-page-inner.tsx",
  "components/admin/gift-baskets-admin.tsx",
  "actions/gift-baskets-admin.ts",
  "lib/gift-baskets.ts",
  "lib/dictionary.ts",
];
let bad = 0;
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.ESNext, true, f.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const diags = sf.parseDiagnostics || [];
  if (diags.length) {
    bad++;
    console.log("SYNTAX ERRORS in " + f + ":");
    for (const d of diags) {
      const p = sf.getLineAndCharacterOfPosition(d.start);
      console.log("  line " + (p.line+1) + ": " + ts.flattenDiagnosticMessageText(d.messageText, "\n"));
    }
  } else {
    console.log("OK  " + f);
  }
}
process.exit(bad ? 1 : 0);
