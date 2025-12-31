import { setCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { hashOTP } from "@/lib/otp";
import { otpTable, user } from "@/db/schema";
import { db } from "@/db";

const verifyOTP = new Hono();

verifyOTP.post("/verify-otp", async (c) => {
  const { email, otp } = await c.req.json();

  const otpRecord = await db.query.otpTable.findFirst({
    where: (otpTable, { eq }) => eq(otpTable.email, email),
  });

  if (!otpRecord) return c.json({ error: "OTP not found" }, 400);
  if (otpRecord.expiresAt < new Date())
    return c.json({ error: "OTP expired" }, 400);

  const hash = await hashOTP(otp);
  if (hash !== otpRecord.otpHash) return c.json({ error: "Invalid OTP" }, 400);

  const existingUser = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.email, email),
  });

  if (existingUser) {
    if (!existingUser.emailVerified) {
      await db
        .update(user)
        .set({
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(user.email, email));
    }
  } else {
    await db.insert(user).values({
      id: crypto.randomUUID(),
      email,
      name: email.split("@")[0],
      emailVerified: true,
    });
  }

  await db.delete(otpTable).where(eq(otpTable.email, email));

  //  Create session cookie
  setCookie(c, "session", crypto.randomUUID(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return c.json({ success: true });
});
export default verifyOTP;
