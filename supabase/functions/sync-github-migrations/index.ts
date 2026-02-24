import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
    const GITHUB_OWNER = Deno.env.get("GITHUB_OWNER");
    const GITHUB_REPO = Deno.env.get("GITHUB_REPO");

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
      return new Response(
        JSON.stringify({ error: "Missing GitHub configuration secrets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. List files in supabase/migrations/ from GitHub
    const ghHeaders = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "lovable-migration-sync",
    };

    const contentsUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/supabase/migrations`;
    const contentsRes = await fetch(contentsUrl, { headers: ghHeaders });

    if (!contentsRes.ok) {
      const errText = await contentsRes.text();
      return new Response(
        JSON.stringify({ error: `GitHub API error: ${contentsRes.status}`, details: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const files = await contentsRes.json();
    const sqlFiles = (Array.isArray(files) ? files : [])
      .filter((f: any) => f.name.endsWith(".sql"))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    if (sqlFiles.length === 0) {
      return new Response(
        JSON.stringify({ message: "No SQL files found", applied: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get already-applied migrations
    const { data: applied } = await supabaseAdmin
      .from("applied_migrations")
      .select("filename, content_hash");

    const appliedMap = new Map(
      (applied || []).map((m: any) => [m.filename, m.content_hash])
    );

    // 3. Process new migrations
    const results: any[] = [];

    for (const file of sqlFiles) {
      if (appliedMap.has(file.name)) {
        continue; // Already applied
      }

      try {
        // Download raw SQL content
        const rawRes = await fetch(file.download_url, { headers: ghHeaders });
        if (!rawRes.ok) {
          throw new Error(`Failed to download ${file.name}: ${rawRes.status}`);
        }
        const sqlContent = await rawRes.text();
        const contentHash = file.sha;

        // Execute the SQL
        const { error: execError } = await supabaseAdmin.rpc("exec_sql", {
          query: sqlContent,
        });

        if (execError) {
          // Record failure
          await supabaseAdmin.from("applied_migrations").insert({
            filename: file.name,
            status: "error",
            error_message: execError.message,
            content_hash: contentHash,
          });
          results.push({ filename: file.name, status: "error", error: execError.message });
        } else {
          // Record success
          await supabaseAdmin.from("applied_migrations").insert({
            filename: file.name,
            status: "success",
            content_hash: contentHash,
          });
          results.push({ filename: file.name, status: "success" });
        }
      } catch (err) {
        await supabaseAdmin.from("applied_migrations").insert({
          filename: file.name,
          status: "error",
          error_message: (err as Error).message,
          content_hash: file.sha,
        });
        results.push({ filename: file.name, status: "error", error: (err as Error).message });
      }
    }

    return new Response(
      JSON.stringify({
        message: results.length > 0 ? `Processed ${results.length} migration(s)` : "No new migrations",
        applied: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
