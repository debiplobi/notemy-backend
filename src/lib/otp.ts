export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashOTP(otp: string) {
  const data = new TextEncoder().encode(otp);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(hash).toString("hex");
}
