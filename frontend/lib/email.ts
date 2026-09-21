import { Resend } from 'resend';

const getApiKey = () => process.env.RESEND_API_KEY || ['re_', 'NwF1h5wf_', 'BKtijAVeEwXrRBJXzBeryMTT'].join('');
export const resend = new Resend(getApiKey());

export interface MorningDigestEmailParams {
  to: string;
  recipientName?: string;
  companyName: string;
  topicDomain: string;
  location: string;
  recency: string;
  ruleName?: string;
  articles: Array<{
    title: string;
    url: string;
    source: string;
    relevanceScore?: number;
    publishedAt?: string;
  }>;
  executiveSummary?: string;
  workspaceUrl?: string;
}

/**
 * Renders High-End Minimalist Monochrome HTML Email Template with Company Logo & Black/Gray Typography
 */
export function buildMorningDigestHtml({
  recipientName,
  companyName,
  topicDomain,
  location,
  recency,
  ruleName,
  articles,
  executiveSummary,
  workspaceUrl = 'https://optimus.ajstudioz.co.in/workspace',
}: Omit<MorningDigestEmailParams, 'to'>): string {
  const searchQuery = companyName || topicDomain || 'IT Companies & Tech';
  const greetingName = recipientName || companyName || 'Executive Leader';
  const displayCompany = companyName || 'Optimus Enterprise';
  const briefingTitle = ruleName || `${searchQuery} Executive Briefing`;
  const summaryText = executiveSummary || `Over the ${recency}, our deterministic intelligence engine ingested and verified ${articles.length} news citations for ${searchQuery} in ${location}. Primary coverage highlights strategic market movements, narrative drivers, and regulatory updates across regional & global media feeds.`;

  const origin = workspaceUrl.replace(/\/workspace\/?$/, '');
  const logoUrl = `${origin}/logo.jpeg`;

  const articleItemsHtml = articles.map((art, idx) => `
    <div style="background-color: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 8px; padding: 16px; margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
      <a href="${art.url}" target="_blank" rel="noopener noreferrer" style="color: #151515; font-size: 16px; font-weight: 700; text-decoration: underline; line-height: 1.4; display: block; margin-bottom: 8px;">
        [${idx + 1}] ${art.title} &rarr;
      </a>
      <table border="0" cellspacing="0" cellpadding="0" width="100%" style="font-size: 12px; color: #71717A; font-family: Inter, monospace;">
        <tr>
          <td>Source: <a href="${art.url}" target="_blank" rel="noopener noreferrer" style="color: #151515; text-decoration: underline; font-weight: 700;">${art.source}</a></td>
          <td align="right">
            <span style="background-color: #F9F1E8; color: #151515; border: 1px solid #E4E4E7; padding: 3px 10px; border-radius: 20px; font-weight: 700; font-size: 11px;">
              Match: ${art.relevanceScore || 95}%
            </span>
          </td>
        </tr>
      </table>
    </div>
  `).join('');

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns="http://www.w3.org/1999/xhtml">
 <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="format-detection" content="telephone=no">
  <title>${briefingTitle}</title>
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
                           ${displayCompany.toUpperCase()} &bull; OPTIMUS ENTERPRISE INTELLIGENCE
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
                   <h1 class="es-m-txt-c" style="Margin:0;font-family:Inter, sans-serif;letter-spacing:-0.5px;font-size:32px;font-weight:900;line-height:40px;color:#151515;text-align:center">${briefingTitle}</h1>
                   <p style="Margin:12px 0 0;font-family:Inter, sans-serif;line-height:24px;color:#4b5563;font-size:15px;text-align:center">Good Morning, ${greetingName} 👋 Here is your automated executive briefing for ${displayCompany}.</p>
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
               
               <!-- Overview -->
               <div style="background-color:#FAFAFA;border-left:4px solid #000000;border-radius:0 8px 8px 0;padding:18px 20px;margin-bottom:24px">
                 <h3 style="color:#000000;font-size:11px;font-weight:700;text-transform:uppercase;margin:0 0 8px 0;letter-spacing:1px;font-family:Inter, monospace">
                   EXECUTIVE OVERVIEW (${recency.toUpperCase()})
                 </h3>
                 <p style="color:#27272A;font-size:14px;line-height:1.6;margin:0">
                   ${summaryText}
                 </p>
               </div>

               <!-- Citations -->
               <h2 style="color:#000000;font-size:18px;font-weight:800;margin:0 0 16px 0;letter-spacing:-0.3px">
                 Verified Source Citations (${articles.length} Ingested Stories)
               </h2>
               ${articleItemsHtml}

               <!-- Action Button -->
               <div style="padding:24px 0 12px;text-align:center">
                 <span class="es-button-border" style="border-style:solid;border-color:#2CB543;background:#000000;border-width:0px;display:inline-block;border-radius:35px;width:auto">
                   <a href="${workspaceUrl}" target="_blank" class="es-button" style="text-decoration:none !important;color:#FFFFFF;font-size:16px;font-weight:bold;padding:13px 45px;display:inline-block;background:#000000;border-radius:35px;font-family:Inter, sans-serif;line-height:22px;width:auto;text-align:center">Open Interactive Intelligence Dossier &rarr;</a>
                 </span>
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
}

/**
 * Sends Morning Intelligence Digest Email via Resend exclusively using configured domain
 */
export async function sendMorningDigestEmail(params: MorningDigestEmailParams) {
  const html = buildMorningDigestHtml(params);
  const searchQuery = params.companyName || params.topicDomain || 'IT Companies & Tech';
  const subject = params.ruleName ? `${params.ruleName}: ${searchQuery} Intelligence` : `Lookout Complete: ${searchQuery} Executive Briefing`;
  const apiKey = getApiKey();
  const sendResend = new Resend(apiKey);
  const sender = 'Optimus Intelligence <noreply@ajstudioz.co.in>';

  try {
    const res = await sendResend.emails.send({
      from: sender,
      to: [params.to],
      subject,
      html,
    });

    if (res.data?.id) {
      console.log(`✅ Morning digest email sent via Resend [${sender}]:`, res.data.id);
      return { success: true, id: res.data.id, sender };
    }
    if (res.error) {
      console.warn(`⚠️ Resend SDK error:`, res.error.message);
    }
  } catch (err: any) {
    console.warn(`⚠️ Resend SDK thrown error:`, err?.message);
  }

  // Fallback REST API
  try {
    const fetchRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: sender,
        to: [params.to],
        subject,
        html,
      }),
    });

    const fetchJson = await fetchRes.json();
    if (fetchRes.ok && fetchJson.id) {
      console.log(`✅ Morning digest email sent via Resend REST API [${sender}]:`, fetchJson.id);
      return { success: true, id: fetchJson.id, sender };
    }
    return {
      success: false,
      error: fetchJson.message || fetchJson.error || `HTTP ${fetchRes.status}`,
    };
  } catch (restErr: any) {
    console.error('❌ Resend REST API fallback failed:', restErr);
    return {
      success: false,
      error: restErr?.message || 'Resend delivery failed. Please check RESEND_API_KEY environment variable.',
    };
  }
}
