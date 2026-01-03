import { Hono } from "hono";
import { auth } from "@/lib/auth";
import { cors } from "hono/cors";
import { sendOTP } from "@/routes/auth/sendOTP";
import verifyOTP from "@/routes/auth/verifyOTP";

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL!,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.route("/auth", sendOTP);
app.route("/auth", verifyOTP);

app.get("/_debug/routes", (c) => {
  return c.json(app.routes.map((r) => r.path));
});

export default {
  port: 8787,
  fetch: app.fetch,
};
