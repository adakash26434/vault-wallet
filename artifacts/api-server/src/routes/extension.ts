import { Router } from "express";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const archiver = require("archiver") as typeof import("archiver");
import path from "node:path";
import fs from "node:fs";

const router = Router();

const EXT_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../../../../artifacts/personal-key-wallet/public/extension"
);

router.get("/extension/download", (req, res) => {
  if (!fs.existsSync(EXT_DIR)) {
    res.status(404).json({ error: "Extension files not found" });
    return;
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", "attachment; filename=personal-key-wallet-extension.zip");

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => {
    res.status(500).json({ error: err.message });
  });

  archive.pipe(res);
  archive.directory(EXT_DIR, "personal-key-wallet-extension");
  archive.finalize();
});

export default router;
