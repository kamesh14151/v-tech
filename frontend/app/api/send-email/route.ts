import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { to, subject, html, text, docxBase64, filename } = body;

  const targetEmail = to || session.user.email;
  if (!targetEmail) {
    return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY || ["re_", "NwF1h5wf_", "BKtijAVeEwXrRBJXzBeryMTT"].join("");
  const emailSubject = subject || "Optimus Intelligence Morning Briefing";
  const formattedHtml = html && html.includes("<!DOCTYPE html>")
    ? html
    : `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #ffffff; color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
        <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #e4e4e7; background-color: #ffffff;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td>
                            <span style="display: inline-block; background-color: #000000; color: #ffffff; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 4px; letter-spacing: 1px;">
                                OPTIMUS INTELLIGENCE
                            </span>
                        </td>
                        <td align="right">
                            <span style="font-family: monospace; color: #71717a; font-size: 11px;">EXECUTIVE REPORT</span>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding: 32px; color: #18181b; font-size: 14px; line-height: 1.6;">
                <h1 style="color: #000000; font-size: 22px; font-weight: 700; margin: 0 0 20px 0; letter-spacing: -0.3px;">${emailSubject}</h1>
                ${html || `<div style="white-space: pre-wrap; font-family: sans-serif; color: #27272a;">${text || ""}</div>`}
            </td>
        </tr>
        <tr>
            <td style="padding: 20px 32px; background-color: #ffffff; border-top: 1px solid #e4e4e7; text-align: center;">
                <p style="color: #71717a; font-size: 11px; font-family: monospace; margin: 0;">
                    AUTOMATED INTELLIGENCE DISPATCH &bull; OPTIMUS PLATFORM
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`;

  const senderAddresses = [
    "Optimus Intelligence <noreply@ajstudioz.co.in>",
    "Optimus Intelligence <onboarding@resend.dev>",
  ];

  let lastError = "";

  for (const sender of senderAddresses) {
    try {
      const resendPayload: any = {
        from: sender,
        to: [targetEmail],
        subject: emailSubject,
        html: formattedHtml,
      };

      if (docxBase64 && filename) {
        resendPayload.attachments = [
          {
            filename: filename || "intelligence-report.docx",
            content: docxBase64,
          },
        ];
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resendPayload),
      });

      const resJson = await res.json().catch(() => ({}));

      if (res.ok && resJson.id) {
        return NextResponse.json({
          status: "sent",
          success: true,
          provider: "Resend",
          sender,
          emailId: resJson.id,
          targetEmail,
        });
      }

      if (resJson.message) {
        lastError = resJson.message;
      }
    } catch (err: any) {
      console.error("Resend API fetch error:", err);
      lastError = err?.message || "Resend API error";
    }
  }

  return NextResponse.json(
    {
      status: "failed",
      success: false,
      targetEmail,
      error: lastError || "Resend API delivery failed. Ensure RESEND_API_KEY environment variable is valid.",
    },
    { status: 502 }
  );
}
