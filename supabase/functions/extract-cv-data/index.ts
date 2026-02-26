import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const record = payload.record || payload; // handle raw record or webhook payload

    if (!record || !record.id || !record.resume_url) {
      return new Response(
        JSON.stringify({ message: "No resume_url found in record", skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { id, resume_url } = record;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    console.log(`Processing CV for candidate ${id} from ${resume_url}`);

    // Determine mime type from URL extension
    let mimeType = "application/pdf";
    if (resume_url.toLowerCase().endsWith(".png")) mimeType = "image/png";
    if (resume_url.toLowerCase().endsWith(".jpg") || resume_url.toLowerCase().endsWith(".jpeg")) mimeType = "image/jpeg";

    // Fetch the file as ArrayBuffer
    const response = await fetch(resume_url);
    if (!response.ok) {
      throw new Error(`Failed to download resume: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();

    // Convert ArrayBuffer to Base64
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = "";
    // Avoid maximum call stack size exceeded for huge files
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64Data = btoa(binary);

    console.log(`Calling Gemini API to parse CV...`);
    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    const prompt = `
Extract the following information from this resume and return ONLY a valid JSON object. Do not include markdown formatting or backticks around the JSON.
Required JSON format:
{
  "skills": ["skill1", "skill2"],
  "experience_years": 5,
  "education": ["Degree from University"],
  "summary": "Brief professional summary."
}
If information is missing, use empty arrays or 0.
`;

    const geminiPayload = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Data } }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    };

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiResponse.ok) {
      const errObj = await geminiResponse.text();
      throw new Error(`Gemini API Error: ${errObj}`);
    }

    const geminiData = await geminiResponse.json();
    const extractedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!extractedText) {
      throw new Error("No text returned from Gemini API");
    }

    // Parse JSON safely
    let cvData;
    try {
      cvData = JSON.parse(extractedText.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (e) {
      throw new Error(`Failed to parse Gemini output as JSON: ${extractedText}`);
    }

    console.log(`Extracted Data:`, cvData);

    // Update the candidate in Supabase
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: updateError } = await supabaseAdmin
      .from("candidates")
      .update({ cv_data: cvData })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, cv_data: cvData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in extract-cv-data:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
