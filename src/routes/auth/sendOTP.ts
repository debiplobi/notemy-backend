import { Hono } from "hono";
import { generateOTP, hashOTP } from "@/lib/otp";
import { otpTable } from "@/db/schema";
import { db } from "@/db";
import { transporter } from "@/lib/mailer";

export const sendOTP = new Hono();

sendOTP.post("/send-otp", async (c) => {
  const { email } = await c.req.json();

  const user = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.email, email),
  });

  if (!user) {
    return c.json({ error: "invalid email" }, 404);
  }
  const otp = generateOTP();
  const otpHash = await hashOTP(otp);

  await db.insert(otpTable).values({
    email,
    otpHash,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  await transporter.sendMail({
    to: email,
    from: process.env.MAIL_FROM,
    subject: "Notemy Email Verification OTP Code",
    html: `
      <div style="font-family:sans-serif">
        <h2>Your OTP</h2>
        <p>Use the code below to continue:</p>
        <h1>${otp}</h1>
        <p>This code expires in 5 minutes.</p>
      </div>
    `,
  });

  return c.json({ success: true });
});
