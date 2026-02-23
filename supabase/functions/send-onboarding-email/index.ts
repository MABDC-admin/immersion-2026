import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
    to: string;
    firstName: string;
    lastName: string;
    startDate?: string;
    type?: 'onboarding' | 'approval';
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { to, firstName, lastName, startDate, type }: EmailPayload = await req.json();

        let subject = "Welcome to the Team!";
        let html = `
      <h1>Welcome, ${firstName}!</h1>
      <p>We're excited to have you join us at Immersion HRMS.</p>
      <p>You can now log in to your employee portal to complete your onboarding checklist.</p>
      <br />
      <p>Best regards,</p>
      <p>The HR Team</p>
    `;

        if (type === 'approval') {
            subject = "Confirmation of Onboarding - M.A Brain Development Center";
            html = `
        <p>Dear ${firstName} ${lastName},</p>
        <p>We are pleased to confirm your onboarding with <strong>M.A Brain Development Center</strong>, effective ${startDate || '[Start Date]'}. We are delighted to welcome you to our team and look forward to the skills and experience you will bring to our organization.</p>
        <p>We are confident that you will be a valuable addition to our growing community, and we look forward to a successful journey together.</p>
        <p>Should you have any questions, feel free to reach out at any time.</p>
        <br />
        <p>Kind regards,</p>
        <p>HR Manager</p>
        <p>M.A Brain Development Center</p>
      `;
        }

        const { data, error } = await resend.emails.send({
            from: "Immersion HRMS <immersion@mabdc.com>",
            to: [to],
            subject: subject,
            html: html,
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
