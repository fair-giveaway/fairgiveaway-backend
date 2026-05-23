import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { connectDB } from "./db";
import { drawRoutes } from "./routes/draw";
import { contactRoutes } from "./routes/contact";
import { xRoutes, xScrapeRoutes } from "./routes/x";
import { swaggerConfig } from "./swagger";

const PORT = 7860;

async function main(): Promise<void> {
  await connectDB();

  const app = new Elysia()
    .use(
      cors({
        origin: [
          /^https?:\/\/localhost:3000$/,
          /^https?:\/\/([a-zA-Z0-9-]+\.)*fairgiveaway\.online$/,
        ],
        credentials: true,
      }),
    )
    .use(swagger(swaggerConfig))
    .use(xRoutes())
    .use(xScrapeRoutes())
    .use(drawRoutes())
    .use(contactRoutes())
    .use(systemRoutes())
    .listen({ port: PORT, hostname: "0.0.0.0" });

  console.log(
    `🎲 FairGiveaway API running at http://localhost:${app.server?.port}`,
  );
}

function systemRoutes() {
  return new Elysia()
    .get("/api/health-check-xyz-9912", () => "OK", {
      response: t.String({ description: "Returns 'OK' when the server is running." }),
      detail: {
        tags: ["System"],
        summary: "Health Check",
        description: "Simple liveness probe. Returns 'OK' if the API server is running and accepting requests. Used by Docker, load balancers, and uptime monitors.",
      },
    })
    .get("/", () => ({
      name: "FairGiveaway API",
      version: "1.0.0",
      docs: "/docs",
    }), {
      response: t.Object({
        name: t.String({ description: "API name." }),
        version: t.String({ description: "Current API version." }),
        docs: t.String({ description: "Path to the interactive API documentation." }),
      }),
      detail: {
        tags: ["System"],
        summary: "API Info",
        description: "Returns basic metadata about the API: name, version, and a link to the interactive Scalar documentation.",
      },
    });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
