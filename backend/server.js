import express from "express";
import cors from "cors";
import helmet from "helmet";
import { CRM_API_BASE_URL } from "./utils/crmClient.js";
import { publicStudioRouter } from "./routes/publicStudioRoutes.js";
import { salesRouter } from "./routes/salesRoutes.js";

if (process.env.NODE_ENV === "production") {
  const warnings = [];

  if (!process.env.FRONTEND_URL?.trim()) {
    warnings.push("FRONTEND_URL saknas — CORS tillåter localhost i produktion");
  }

  if (!process.env.CRM_API_BASE_URL?.trim() || CRM_API_BASE_URL.includes("localhost")) {
    warnings.push("CRM_API_BASE_URL pekar på localhost — ange korrekt produktions-URL");
  }

  for (const warning of warnings) {
    console.warn(`[inkrevenue] VARNING: ${warning}`);
  }
}

function normalizeOrigin(origin) {
  return origin?.trim().replace(/\/+$/, "");
}

function getAllowedOrigins() {
  const configuredOrigins =
    process.env.FRONTEND_URL?.split(",")
      .map((origin) => normalizeOrigin(origin))
      .filter(Boolean) || [];

  return configuredOrigins.length
    ? configuredOrigins
    : [normalizeOrigin("http://localhost:5174"), normalizeOrigin("http://localhost:5173")];
}

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      const normalizedOrigin = normalizeOrigin(origin);
      const allowedOrigins = getAllowedOrigins();

      if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin saknar CORS-behörighet."));
    },
    methods: ["GET", "POST"]
  })
);
app.use(express.json({ limit: "6mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", crmApiBaseUrl: CRM_API_BASE_URL });
});

app.use("/api/public/studios", publicStudioRouter);
app.use("/api", salesRouter);

app.get("/sitemap.xml", async (_req, res) => {
  const SITE = "https://inkrevenue.online";
  const today = new Date().toISOString().slice(0, 10);

  const staticUrls = [
    { loc: `${SITE}/`, priority: "1.0", changefreq: "weekly" },
    { loc: `${SITE}/studios`, priority: "0.9", changefreq: "daily" }
  ];

  let studioUrls = [];
  try {
    const { requestCrmPublicApi } = await import("./utils/crmClient.js");
    const { response, payload } = await requestCrmPublicApi("/studios");
    const studios = Array.isArray(payload?.data) ? payload.data : [];
    studioUrls = studios
      .filter((s) => s?.slug)
      .map((s) => ({
        loc: `${SITE}/studio/${encodeURIComponent(s.slug)}`,
        priority: "0.7",
        changefreq: "weekly"
      }));
  } catch {
    // non-fatal — serve static URLs only
  }

  const allUrls = [...staticUrls, ...studioUrls];
  const urlEntries = allUrls
    .map(
      ({ loc, priority, changefreq }) =>
        `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`;

  res.set("Content-Type", "application/xml");
  res.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
  res.send(xml);
});

app.use((req, res) => {
  res.status(404).json({ message: "Endpointen kunde inte hittas." });
});

app.use((error, req, res, _next) => {
  const statusCode = Number(error?.statusCode || error?.status || 500);
  const isJsonSyntaxError =
    error instanceof SyntaxError && typeof error?.body === "string";
  const message = isJsonSyntaxError
    ? "Ogiltig JSON i begaran."
    : error?.message || "Internt serverfel.";

  console.error("[inkrevenue] API error", {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message
  });

  res.status(isJsonSyntaxError ? 400 : statusCode).json({ message });
});

app.listen(PORT, () => {
  console.log(`Ink Revenue API running on http://localhost:${PORT}`);
});
