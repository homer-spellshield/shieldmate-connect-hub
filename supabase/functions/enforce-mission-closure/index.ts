import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// This function is designed to be run on a schedule (e.g., once a day) by Supabase Cron Jobs.
// It finds missions that have been pending closure for more than 3 days and automatically completes them.

serve(async (req: Request) => {
  // 1. Create a Supabase admin client to perform privileged operations.
  // This uses the SERVICE_ROLE_KEY to bypass Row Level Security.
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // 2. Calculate the timestamp for 3 days ago.
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // 3. Query for missions that are 'pending_closure' and were initiated more than 3 days ago.
    const { data: missionsToClose, error: queryError } = await supabaseAdmin
      .from('missions')
      .select('id, title')
      .eq('status', 'pending_closure')
      .lt('closure_initiated_at', threeDaysAgo.toISOString());

    if (queryError) {
      throw queryError;
    }

    if (!missionsToClose || missionsToClose.length === 0) {
      console.log('No missions require automatic closure.');
      return new Response(JSON.stringify({ success: true, message: "No missions to close." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Extract the IDs of the missions that need to be updated.
    const missionIds = missionsToClose.map(m => m.id);

    // 5. Update the status of these missions to 'completed' and set the closed_at timestamp.
    const { error: updateError } = await supabaseAdmin
      .from('missions')
      .update({
        status: 'completed',
        closed_at: new Date().toISOString()
      })
      .in('id', missionIds);

    if (updateError) {
      throw updateError;
    }

    console.log(`Successfully closed ${missionIds.length} mission(s):`, missionsToClose.map(m => m.title).join(', '));

    // 6. Return a success response.
    return new Response(JSON.stringify({
      success: true,
      message: `Successfully closed ${missionIds.length} mission(s).`
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in enforce-mission-closure function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
