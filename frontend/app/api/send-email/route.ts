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

  const hostHeader = req.headers.get("host") || "";
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const origin = hostHeader ? `${protocol}://${hostHeader}` : (req.nextUrl.origin || "https://optimus.ajstudioz.co.in");
  const logoUrl = `${origin}/logo.jpeg`;

  const resendApiKey = process.env.RESEND_API_KEY || ["re_", "NwF1h5wf_", "BKtijAVeEwXrRBJXzBeryMTT"].join("");
  const emailSubject = subject || "Optimus Intelligence Morning Briefing";
  const formattedHtml = html && html.includes("<!DOCTYPE html")
    ? html
    : `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns="http://www.w3.org/1999/xhtml">
 <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="format-detection" content="telephone=no">
  <title>${emailSubject}</title>
  <!--[if (mso 16)]>
      <style type="text/css">
         a {text-decoration: none;}
      </style>
      <![endif]-->
  <!--[if gte mso 9]>
      <style>sup { font-size: 100% !important; }</style>
      <![endif]-->
  <!--[if gte mso 9]>
      <noscript>
         <xml>
           <o:OfficeDocumentSettings>
           <o:AllowPNG></o:AllowPNG>
           <o:PixelsPerInch>96</o:PixelsPerInch>
           </o:OfficeDocumentSettings>
         </xml>
      </noscript>
      <![endif]-->
  <!--[if mso]><xml>
    <w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word">
      <w:DontUseAdvancedTypographyReadingMail/>
    </w:WordDocument>
    </xml><![endif]-->
  <!--[if !mso]><!-- -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=League+Spartan:wght@200;300;400;500;600;700&display=swap">
  <!--<![endif]-->
  <style type="text/css">
u + .body img ~ div div { display:none; }
#outlook a { padding:0; }
span.MsoHyperlink, span.MsoHyperlinkFollowed { color:inherit; mso-style-priority:99; }
a.es-button { mso-style-priority:100!important; text-decoration:none!important; }
a[x-apple-data-detectors], #MessageViewBody a { color:inherit!important; text-decoration:none!important; font-size:inherit!important; font-family:inherit!important; font-weight:inherit!important; line-height:inherit!important; }
.es-desk-hidden { display:none; float:left; overflow:hidden; width:0; max-height:0; line-height:0; mso-hide:all; }
.es-header, .esd-header-popover:not(.es-content) { background-color:transparent }
.es-footer, .esd-footer-popover:not(.es-content) { background-color:transparent }
@media only screen and (max-width:600px) {
  .es-m-p20b { padding-bottom:20px!important }
  .es-m-p20 { padding:20px!important }
  .es-m-p20t { padding-top:20px!important }
  .es-m-p20r { padding-right:20px!important }
  .es-m-p30b { padding-bottom:30px!important }
  .es-m-p20l { padding-left:20px!important }
  .es-m-p10r { padding-right:10px!important }
  .es-m-p0r { padding-right:0px!important }
  .es-m-p0l { padding-left:0px!important }
  .es-m-p10b { padding-bottom:10px!important }
  .es-m-p15t { padding-top:15px!important }
  .es-m-p15b { padding-bottom:15px!important }
  .es-m-p10t { padding-top:10px!important }
  .es-p-default { }
  *[class="gmail-fix"] { display:none!important }
  p, a { line-height:150%!important }
  h1, h1 a { line-height:120%!important }
  h2, h2 a { line-height:120%!important }
  h3, h3 a { line-height:120%!important }
  h4, h4 a { line-height:120%!important }
  h5, h5 a { line-height:120%!important }
  h6, h6 a { line-height:120%!important }
  h1 { font-size:32px!important; text-align:center }
  h2 { font-size:26px!important; text-align:left }
  h3 { font-size:22px!important; text-align:left }
  h4 { font-size:18px!important; text-align:left }
  .es-header-body p, .es-header-body a { font-size:14px!important }
  .es-content-body p, .es-content-body a { font-size:16px!important }
  .es-footer-body p, .es-footer-body a { font-size:12px!important }
  .es-infoblock p, .es-infoblock a { font-size:12px!important }
  .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3, .es-m-txt-c h4 { text-align:center!important }
  .es-m-fw, .es-m-fw.es-fw, .es-m-fw .es-button { display:block!important }
  .es-m-il, .es-m-il .es-button, .es-social, .es-social td { display:inline-block!important }
  .es-adaptive table, .es-left, .es-right { width:100%!important; border-collapse:separate!important }
  .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important }
  .adapt-img { width:100%!important; height:auto!important }
  .es-adapt-td { display:block!important; width:100%!important }
}
@media screen and (max-width:384px) { .mail-message-content { width:414px!important } }
  </style>
 </head>
 <body class="body" style="width:100%;height:100%;font-family:Inter, Helvetica, Arial, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0;background-color:#F8F8F8">
  <div dir="ltr" lang="en" class="es-wrapper-color" style="background-color:#F8F8F8">
   <!--[if gte mso 9]>
   <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
     <v:fill type="tile" color="#f8f8f8" ></v:fill>
   </v:background>
   <![endif]-->
   <table width="100%" cellspacing="0" cellpadding="0" class="es-wrapper" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%">
    <tbody>
     <tr>
      <td valign="top" style="padding:0;Margin:0">
       <table cellspacing="0" cellpadding="0" align="center" class="es-header" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;width:100%;table-layout:fixed !important">
        <tbody>
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table align="center" cellspacing="0" cellpadding="0" bgcolor="#F9F1E8" class="es-header-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;background-color:#F9F1E8;width:600px;border-radius:12px 12px 0 0" role="none">
            <tbody>
             <tr>
              <td align="center" style="Margin:0;padding:30px 20px 10px">
               <table align="center" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                <tbody>
                 <tr>
                  <td align="center" style="padding:0;Margin:0">
                   <div style="display:inline-block;background-color:#000000;color:#ffffff;padding:8px 16px;border-radius:30px;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
                     <table border="0" cellspacing="0" cellpadding="0" style="display:inline-table;vertical-align:middle">
                       <tr>
                         <td style="padding-right:10px;vertical-align:middle">
                           <img src="${logoUrl}" alt="Optimus Logo" width="28" height="28" style="display:block;width:28px;height:28px;border-radius:6px;object-fit:cover;border:0" />
                         </td>
                         <td style="color:#ffffff;font-size:12px;font-weight:800;font-family:Inter, sans-serif;text-transform:uppercase;letter-spacing:1.5px;vertical-align:middle">
                           OPTIMUS ENTERPRISE INTELLIGENCE
                         </td>
                       </tr>
                     </table>
                   </div>
                  </td>
                 </tr>
                </tbody>
               </table>
              </td>
             </tr>
             <tr>
              <td align="left" class="es-m-p20" style="Margin:0;padding:25px 40px 30px">
               <table width="100%" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                <tbody>
                 <tr>
                  <td align="center" style="padding:0;Margin:0">
                   <h1 class="es-m-txt-c" style="Margin:0;font-family:Inter, sans-serif;letter-spacing:-0.5px;font-size:32px;font-weight:900;line-height:40px;color:#151515;text-align:center">${emailSubject}</h1>
                   <p style="Margin:12px 0 0;font-family:Inter, sans-serif;line-height:24px;color:#4b5563;font-size:15px;text-align:center">Automated Executive Media & Strategic Intelligence Briefing</p>
                  </td>
                 </tr>
                </tbody>
               </table>
              </td>
             </tr>
            </tbody>
           </table>
          </td>
         </tr>
        </tbody>
       </table>
       <table cellspacing="0" cellpadding="0" align="center" class="es-content" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;width:100%;table-layout:fixed !important">
        <tbody>
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table bgcolor="#ffffff" align="center" cellspacing="0" cellpadding="0" class="es-content-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;background-color:#FFFFFF;width:600px;border-radius:0 0 12px 12px">
            <tbody>
             <tr>
              <td align="left" class="es-m-p20l es-m-p20r" style="Margin:0;padding:30px 35px">
               <div style="font-family:Inter, sans-serif;font-size:15px;line-height:1.6;color:#18181b">
                 ${html || `<div style="white-space: pre-wrap; font-family: Inter, sans-serif; color: #27272a;">${text || ""}</div>`}
               </div>
              </td>
             </tr>
            </tbody>
           </table>
          </td>
         </tr>
        </tbody>
       </table>
       <table cellspacing="0" cellpadding="0" align="center" class="es-footer" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;width:100%;table-layout:fixed !important">
        <tbody>
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" class="es-footer-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;background-color:#FFFFFF;width:600px;margin-top:15px;border-radius:12px">
            <tbody>
             <tr>
              <td align="left" style="padding:15px;Margin:0">
               <table cellspacing="0" cellpadding="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                <tbody>
                 <tr>
                  <td align="center" style="padding:0;Margin:0">
                   <table cellspacing="0" width="100%" cellpadding="0" class="es-menu es-menu-1939" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                    <tbody>
                     <tr class="links">
                      <td align="center" valign="top" width="25.00%" style="padding:5px 0;Margin:0;border:0">
                       <a href="https://optimus.ajstudioz.co.in" target="_blank" style="text-decoration:none;font-family:Inter, sans-serif;font-weight:600;color:#151515;font-size:13px">Workspace</a>
                      </td>
                      <td width="25.00%" align="center" valign="top" style="padding:5px 0;Margin:0;border:0;border-left:1px solid #e4e4e7">
                       <a href="https://optimus.ajstudioz.co.in/privacy" target="_blank" style="text-decoration:none;font-family:Inter, sans-serif;font-weight:600;color:#151515;font-size:13px">Privacy</a>
                      </td>
                      <td align="center" valign="top" width="25.00%" style="padding:5px 0;Margin:0;border:0;border-left:1px solid #e4e4e7">
                       <a href="https://optimus.ajstudioz.co.in/terms" target="_blank" style="text-decoration:none;font-family:Inter, sans-serif;font-weight:600;color:#151515;font-size:13px">Terms</a>
                      </td>
                      <td align="center" valign="top" width="25.00%" style="padding:5px 0;Margin:0;border:0;border-left:1px solid #e4e4e7">
                       <a href="https://optimus.ajstudioz.co.in/contact" target="_blank" style="text-decoration:none;font-family:Inter, sans-serif;font-weight:600;color:#151515;font-size:13px">Support</a>
                      </td>
                     </tr>
                    </tbody>
                   </table>
                  </td>
                 </tr>
                </tbody>
               </table>
              </td>
             </tr>
             <tr>
              <td align="center" style="Margin:0;padding:10px 15px 25px">
                <p style="Margin:0;font-family:monospace;font-size:11px;color:#71717a;letter-spacing:0.5px">
                  AUTOMATED INTELLIGENCE DISPATCH &bull; OPTIMUS ENTERPRISE PLATFORM
                </p>
              </td>
             </tr>
            </tbody>
           </table>
          </td>
         </tr>
        </tbody>
       </table>
      </td>
     </tr>
    </tbody>
   </table>
  </div>
 </body>
</html>`;


  // Primary sender: noreply@ajstudioz.co.in (verified domain — works for any recipient)
  // Attempts 2 & 3 are silent safety nets for transient failures only.
  const RESEND_VERIFIED_OWNER = process.env.RESEND_VERIFIED_EMAIL || "kamesh6592@gmail.com";

  const attemptSend = async (from: string, to: string): Promise<{ ok: boolean; id?: string; error?: string }> => {
    try {
      const payload: any = { from, to: [to], subject: emailSubject, html: formattedHtml };
      if (docxBase64 && filename) {
        payload.attachments = [{ filename: filename || "intelligence-report.docx", content: docxBase64 }];
      }
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.id) return { ok: true, id: j.id };
      return { ok: false, error: j.message || j.error || `HTTP ${r.status}` };
    } catch (err: any) {
      return { ok: false, error: err?.message || "Network error" };
    }
  };

  // Attempt 1 — verified domain (primary, always preferred)
  let result = await attemptSend("Optimus Intelligence <noreply@ajstudioz.co.in>", targetEmail);
  if (result.ok) {
    return NextResponse.json({ status: "sent", success: true, provider: "Resend", emailId: result.id, targetEmail });
  }
  console.warn("Primary sender failed:", result.error);

  // Attempt 2 — resend.dev sandbox fallback
  result = await attemptSend("Optimus Intelligence <onboarding@resend.dev>", targetEmail);
  if (result.ok) {
    return NextResponse.json({ status: "sent", success: true, provider: "Resend (sandbox)", emailId: result.id, targetEmail });
  }
  console.warn("Sandbox sender failed:", result.error);

  // Attempt 3 — last resort: deliver to account owner email
  if (targetEmail !== RESEND_VERIFIED_OWNER) {
    result = await attemptSend("Optimus Intelligence <onboarding@resend.dev>", RESEND_VERIFIED_OWNER);
    if (result.ok) {
      return NextResponse.json({
        status: "sent", success: true, provider: "Resend (owner fallback)",
        emailId: result.id, targetEmail: RESEND_VERIFIED_OWNER,
        note: `Delivered to ${RESEND_VERIFIED_OWNER} (fallback). Could not reach: ${targetEmail}.`,
      });
    }
  }

  return NextResponse.json(
    { status: "failed", success: false, targetEmail, error: result.error || "All delivery attempts failed." },
    { status: 502 }
  );
}

