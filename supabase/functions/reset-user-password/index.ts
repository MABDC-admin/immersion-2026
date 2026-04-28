import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.5.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ResetPayload {
  userId: string;
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

type SupabaseAdminClient = ReturnType<typeof createClient>;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getBearerToken(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function generatePassword(): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const all = upper + lower + digits;
  const chars: string[] = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
  ];

  for (let i = chars.length; i < 8; i++) {
    chars.push(all[Math.floor(Math.random() * all.length)]);
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

async function assertCanResetPasswords(supabaseAdmin: SupabaseAdminClient, token: string) {
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !authData.user) {
    return { allowed: false, status: 401, error: "You must be signed in to reset passwords" };
  }

  const { data: roleData, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .in("role", ["admin", "hr_manager"])
    .limit(1);

  if (roleError) throw roleError;

  if (!roleData?.length) {
    return { allowed: false, status: 403, error: "Only admins and HR managers can reset passwords" };
  }

  return { allowed: true, status: 200, error: null };
}

async function getEmployeeName(supabaseAdmin: SupabaseAdminClient, userId: string) {
  const { data: profileData } = await supabaseAdmin
    .from("profiles")
    .select("first_name, last_name")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: employeeByUser } = await supabaseAdmin
    .from("employees")
    .select("first_name, last_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileData?.first_name || profileData?.last_name || employeeByUser) {
    return {
      firstName: profileData?.first_name || employeeByUser?.first_name || "",
      lastName: profileData?.last_name || employeeByUser?.last_name || "",
    };
  }

  return { firstName: "", lastName: "" };
}

async function getCompanySettings(supabaseAdmin: SupabaseAdminClient): Promise<CompanySettings> {
  const { data: companyData } = await supabaseAdmin
    .from("company_settings")
    .select("name, logo_url, address, city, country, phone, email")
    .limit(1)
    .maybeSingle();

  return {
    name: companyData?.name || "HRMS",
    logo_url: companyData?.logo_url || null,
    address: companyData?.address || null,
    city: companyData?.city || null,
    country: companyData?.country || null,
    phone: companyData?.phone || null,
    email: companyData?.email || null,
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
  <tr><td style="padding:24px 32px;text-align:center;background-color:#ffffff;border-radius:12px 12px 0 0;border-bottom:2px solid #e8e8ef;">
    ${logoHtml}
  </td></tr>
  <tr><td style="padding:32px;background-color:#ffffff;">
    <h2 style="margin:0 0 20px;color:#1a1a2e;font-size:20px;font-weight:600;">${subject}</h2>
    <div style="color:#3d3d4e;font-size:15px;line-height:1.7;">
      ${bodyContent}
    </div>
  </td></tr>
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

function buildResetEmailBody(name: { firstName: string; lastName: string }, email: string, password: string, companyName: string) {
  const loginUrl = "https://immersion.mabdc.com/auth";
  const displayName = `${name.firstName || ""} ${name.lastName || ""}`.trim() || "Immersion Portal User";

  return `
    <p>Dear <strong>${displayName}</strong>,</p>
    <p>Your Immersion Portal password has been reset. Please use the credentials below to log in:</p>
    <div style="margin:24px 0;padding:20px;background-color:#f0f4f8;border-radius:8px;border:1px solid #d0dbe7;">
      <h3 style="margin:0 0 14px;color:#1a1a2e;font-size:16px;font-weight:600;">Your New Immersion Login Credentials</h3>
      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:14px;width:90px;">Username:</td>
          <td style="padding:6px 0;font-family:'Courier New',monospace;font-size:14px;font-weight:600;color:#1a1a2e;">${email}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Password:</td>
          <td style="padding:6px 0;font-family:'Courier New',monospace;font-size:14px;font-weight:600;color:#1a1a2e;">${password}</td>
        </tr>
      </table>
      <div style="text-align:center;margin-bottom:12px;">
        <a href="${loginUrl}" style="display:inline-block;padding:12px 32px;background-color:#1a1a2e;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">Login Immersion Portal</a>
      </div>
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Please change your password after logging in for security purposes.</p>
    </div>
    <p>If you did not expect this change, please contact your HR department immediately.</p>
    <br />
    <p>Kind regards,</p>
    <p><strong>HR Department</strong><br/>${companyName}</p>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const token = getBearerToken(req);
    if (!token) {
      return jsonResponse({ error: "You must be signed in to reset passwords" }, 401);
    }

    const permission = await assertCanResetPasswords(supabaseAdmin, token);
    if (!permission.allowed) {
      return jsonResponse({ error: permission.error }, permission.status);
    }

    const { userId }: ResetPayload = await req.json();
    if (!userId) {
      return jsonResponse({ error: "User ID is required" }, 400);
    }

    const { data: targetData, error: targetError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (targetError || !targetData.user) {
      return jsonResponse({ error: targetError?.message || "No portal account found for this user" }, 404);
    }

    const targetEmail = targetData.user.email?.trim().toLowerCase();
    if (!targetEmail) {
      return jsonResponse({ error: "This portal account has no email address" }, 400);
    }

    const recipientName = await getEmployeeName(supabaseAdmin, targetData.user.id);
    const newPassword = generatePassword();

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetData.user.id, {
      password: newPassword,
      email_confirm: true,
    });

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 400);
    }

    const company = await getCompanySettings(supabaseAdmin);
    const subject = "Immersion Password Reset";
    const bodyContent = buildResetEmailBody(recipientName, targetEmail, newPassword, company.name);
    const html = buildEmailTemplate(company, subject, bodyContent);
    const fromName = company.name || "HRMS";
    const emailPayload: Record<string, unknown> = {
      from: `${fromName} <immersion@mabdc.com>`,
      to: [targetEmail],
      subject: `${subject} - ${company.name}`,
      html,
    };

    if (company.email) {
      emailPayload.reply_to = company.email;
    }

    const { error: emailError } = await resend.emails.send(emailPayload as never);

    if (emailError) {
      return jsonResponse({ error: "Password updated but failed to send email" }, 400);
    }

    return jsonResponse({ success: true, email: targetEmail });
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
