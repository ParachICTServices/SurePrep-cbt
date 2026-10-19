import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getAdminAuth, logAdminError } from "@/app/lib/firebaseAdmin";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const APP_NAME = "TestGrid";

export async function POST(req: Request) {
  const { email } = await req.json();

  try {
    const firebaseLink = await getAdminAuth().generatePasswordResetLink(email);
    const oobCode = new URL(firebaseLink).searchParams.get("oobCode");
    const link = `${APP_URL}/action?mode=resetPassword&oobCode=${oobCode}`;

    const { error } = await resend.emails.send({
      from: `${APP_NAME} <onboarding@resend.dev>`, // swap for your verified domain later
      to: email,
      subject: `Reset your ${APP_NAME} password`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1f2937;">
          <h2 style="margin:0 0 16px;">Reset your password</h2>
          <p style="font-size:15px;line-height:1.6;">We received a request to reset the password for <strong>${email}</strong>.</p>
          <p style="margin:24px 0;">
            <a href="${link}" style="background:#059669;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block;">Reset password</a>
          </p>
          <p style="font-size:13px;color:#6b7280;">Button not working? Paste this into your browser:<br>${link}</p>
          <p style="font-size:13px;color:#6b7280;">This link expires in 1 hour. If you didn't request it, ignore this email.</p>
        </div>`,
    });
    if (error) logAdminError("forgot-password: resend failed", new Error(error.message));
  } catch (err) {
    // Still return ok so the response doesn't reveal which emails are registered.
    logAdminError("forgot-password: failed", err);
  }

  return NextResponse.json({ ok: true });
}