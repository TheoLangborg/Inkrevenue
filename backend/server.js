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
