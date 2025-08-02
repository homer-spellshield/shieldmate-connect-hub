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

    // Query for missions that need to be closed (3+ days in pending_closure)
    const { data: missions, error: queryError } = await supabaseAdmin
      .from('missions')
      .select(`
        id, 
        title, 
        org_closed, 
        volunteer_closed,
        organization_id,
        mission_applications(volunteer_id)
      `)
      .eq('status', 'pending_closure')
      .lt('closure_initiated_at', threeDaysAgo.toISOString());

    if (queryError) throw queryError;

    if (!missions || missions.length === 0) {
      console.log('No missions found that need to be closed');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No missions found that need to be closed',
        processed: 0 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`Found ${missions.length} missions to auto-close`);

    // Process each mission individually for better error handling
    const results = [];
    for (const mission of missions) {
      try {
        // Update mission to completed
        const { error: updateError } = await supabaseAdmin
          .from('missions')
          .update({ 
            status: 'completed',
            closed_at: new Date().toISOString()
          })
          .eq('id', mission.id);

        if (updateError) {
          console.error(`Error updating mission ${mission.id}:`, updateError);
          continue;
        }

        // Notify both parties about auto-closure
        const volunteer_id = mission.mission_applications[0]?.volunteer_id;
        
        // Get organization members
        const { data: orgMembers } = await supabaseAdmin
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', mission.organization_id);

        const notifications = [];
        
        // Notify volunteer
        if (volunteer_id) {
          notifications.push({
            user_id: volunteer_id,
            message: `Mission "${mission.title}" has been automatically completed due to no response within 3 days.`,
            link_url: `/mission/${mission.id}`
          });
        }

        // Notify organization members
        if (orgMembers) {
          orgMembers.forEach(member => {
            notifications.push({
              user_id: member.user_id,
              message: `Mission "${mission.title}" has been automatically completed due to no response within 3 days.`,
              link_url: `/mission/${mission.id}`
            });
          });
        }

        // Insert notifications
        if (notifications.length > 0) {
          await supabaseAdmin.from('notifications').insert(notifications);
        }

        results.push({ id: mission.id, title: mission.title, status: 'completed' });
        console.log(`Successfully auto-closed mission: ${mission.title}`);

      } catch (error) {
        console.error(`Error processing mission ${mission.id}:`, error);
      }
    }

    console.log(`Successfully processed ${results.length} missions`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      processed: results.length,
      missions: results 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
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
