import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers are included directly to prevent import errors during deployment.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function is designed to be run on a schedule (e.g., once a day) by Supabase Cron Jobs.
serve(async (_req: Request) => {
  try {
    // --- Environment Variable Validation ---
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
    }

    // --- Supabase Admin Client Initialization ---
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // --- Main Logic ---
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: missionsToClose, error: queryError } = await supabaseAdmin
      .from('missions')
      .select('id, title')
      .eq('status', 'pending_closure')
      .lt('closure_initiated_at', threeDaysAgo.toISOString());

    if (queryError) throw queryError;

    if (!missionsToClose || missionsToClose.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No missions to close." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const missionIds = missionsToClose.map(m => m.id);

    const { error: updateError } = await supabaseAdmin
      .from('missions')
      .update({
        status: 'completed',
        closed_at: new Date().toISOString()
      })
      .in('id', missionIds);

    if (updateError) throw updateError;
    
    return new Response(JSON.stringify({
      success: true,
      message: `Successfully closed ${missionIds.length} mission(s).`
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in enforce-mission-closure function:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
