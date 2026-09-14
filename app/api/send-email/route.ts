import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import nodemailer from "nodemailer";

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

  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const resendApiKey = process.env.RESEND_API_KEY;

  try {
    // 1. Resend API Integration if available
    if (resendApiKey) {
      const resendPayload: any = {
        from: "Optimus Intelligence <reports@optimus-intelligence.com>",
        to: [targetEmail],
        subject: subject || "Optimus Intelligence Morning Briefing",
        html: html || text,
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

      if (res.ok) {
        return NextResponse.json({ status: "sent", success: true, provider: "Resend", targetEmail });
      }
      const resendError = await res.text().catch(() => "");
      console.error("Resend delivery failed:", res.status, resendError);
    }

    // 2. Nodemailer Gmail / SMTP Integration if credentials exist
    if (gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      const mailOptions: any = {
        from: `"Optimus Intelligence" <${gmailUser}>`,
        to: targetEmail,
        subject: subject || "Optimus Intelligence Morning Briefing",
        text: text || "Your Optimus intelligence dossier is ready.",
        html: html || `<p>${text}</p>`,
      };

      if (docxBase64 && filename) {
        mailOptions.attachments = [
          {
            filename: filename || "intelligence-report.docx",
            content: Buffer.from(docxBase64, "base64"),
            contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          },
        ];
      }

      await transporter.sendMail(mailOptions);
      return NextResponse.json({ status: "sent", success: true, provider: "Gmail SMTP", targetEmail });
    }

    // 3. No automated delivery provider configured. Return a compose URL without claiming delivery.
    const encodedSubject = encodeURIComponent(subject || "Optimus Intelligence Morning Briefing");
    const encodedBody = encodeURIComponent(text || "Optimus Intelligence Briefing Summary");
    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodedSubject}&body=${encodedBody}`;

    return NextResponse.json({
      status: "compose_required",
      success: false,
      provider: "Gmail Compose",
      targetEmail,
      gmailComposeUrl,
      notice: "No automated email provider is configured. Open the Gmail compose link or configure RESEND_API_KEY/GMAIL_APP_PASSWORD for automatic delivery.",
    });
  } catch (error: any) {
    console.error("Send email error:", error);
    return NextResponse.json({
      status: "failed",
      success: false,
      targetEmail,
      error: "Email delivery failed. Check the configured email provider and credentials.",
    }, { status: 502 });
  }
}
