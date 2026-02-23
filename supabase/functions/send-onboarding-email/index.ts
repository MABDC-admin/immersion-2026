import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.5.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailPayload {
  to: string;
  firstName: string;
  lastName: string;
  startDate?: string;
  type?: "onboarding" | "approval";
}

interface CompanySettings {
  name: string;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
}

async function getCompanySettings(): Promise<CompanySettings> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, supabaseKey);

  const { data } = await sb.from("company_settings").select("name, logo_url, address, city, country, phone, email").limit(1).maybeSingle();

  return {
    name: data?.name || "HRMS",
    logo_url: data?.logo_url || null,
    address: data?.address || null,
    city: data?.city || null,
    country: data?.country || null,
    phone: data?.phone || null,
    email: data?.email || null,
  };
}

function buildEmailTemplate(company: CompanySettings, subject: string, bodyContent: string): string {
  const logoHtml = company.logo_url
    ? `<img src="${company.logo_url}" alt="${company.name}" style="max-width:180px;max-height:80px;display:block;margin:0 auto;" />`
    : `<div style="font-size:24px;font-weight:bold;color:#1a1a2e;text-align:center;">${company.name}</div>`;

  const footerParts: string[] = [];
  if (company.address) footerParts.push(company.address);
  if (company.city && company.country) footerParts.push(`${company.city}, ${company.country}`);
  else if (company.city) footerParts.push(company.city);
  if (company.phone) footerParts.push(`Phone: ${company.phone}`);
  if (company.email) footerParts.push(company.email);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:40px 20px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <!-- Logo Header -->
  <tr><td style="padding:24px 32px;text-align:center;background-color:#ffffff;border-radius:12px 12px 0 0;border-bottom:2px solid #e8e8ef;">
    ${logoHtml}
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:32px;background-color:#ffffff;">
    <h2 style="margin:0 0 20px;color:#1a1a2e;font-size:20px;font-weight:600;">${subject}</h2>
    <div style="color:#3d3d4e;font-size:15px;line-height:1.7;">
      ${bodyContent}
    </div>
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:24px 32px;background-color:#fafafa;border-radius:0 0 12px 12px;border-top:1px solid #e8e8ef;text-align:center;">
    <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#6b7280;">${company.name}</p>
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
      ${footerParts.join(" &bull; ")}
    </p>
    <p style="margin:12px 0 0;font-size:11px;color:#d1d5db;">This is an automated message. Please do not reply directly.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, firstName, lastName, startDate, type }: EmailPayload = await req.json();
    const company = await getCompanySettings();

    let subject: string;
    let bodyContent: string;

    if (type === "approval") {
      subject = "Confirmation of Onboarding";
      bodyContent = `
        <p>Dear <strong>${firstName} ${lastName}</strong>,</p>
        <p>We are pleased to confirm your onboarding with <strong>${company.name}</strong>, effective <strong>${startDate || "[Start Date]"}</strong>.</p>
        <p>We are delighted to welcome you to our team and look forward to the skills and experience you will bring to our organization.</p>
        <p>We are confident that you will be a valuable addition to our growing community, and we look forward to a successful journey together.</p>
        <p>Should you have any questions, feel free to reach out at any time.</p>
        <br />
        <p>Kind regards,</p>
        <p><strong>HR Department</strong><br/>${company.name}</p>
      `;
    } else {
      subject = "Welcome to the Team!";
      bodyContent = `
        <p>Dear <strong>${firstName}</strong>,</p>
        <p>We're excited to have you join us at <strong>${company.name}</strong>!</p>
        <p>You can now log in to your employee portal to complete your onboarding checklist and get started.</p>
        <p>If you have any questions during your onboarding process, don't hesitate to reach out to the HR team.</p>
        <br />
        <p>Best regards,</p>
        <p><strong>HR Department</strong><br/>${company.name}</p>
      `;
    }

    const fromName = company.name || "HRMS";
    const fromEmail = company.email ? `${fromName} <${company.email}>` : `${fromName} <immersion@mabdc.com>`;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: `${subject} - ${company.name}`,
      html: buildEmailTemplate(company, subject, bodyContent),
    });

    if (error) {
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
