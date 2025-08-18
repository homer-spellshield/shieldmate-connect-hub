import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Admin client for privileged operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // --- 1. Get data from the request ---
    const { mission_id } = await req.json();
    if (!mission_id) throw new Error("Mission ID is required.");

    // --- 2. Verify the calling user is authenticated ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header");

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw userError || new Error("User not found");

    // --- 3. Fetch mission and participant data ---
    const { data: mission, error: missionError } = await supabaseAdmin
      .from('missions')
      .select(`
        *,
        organization_id,
        mission_applications(volunteer_id)
      `)
      .eq('id', mission_id)
      .single();

    if (missionError || !mission) throw missionError || new Error("Mission not found.");

    const volunteer_id = mission.mission_applications[0]?.volunteer_id;
    if (!volunteer_id) throw new Error("No volunteer found for this mission.");

    // --- 4. Determine roles and who to notify ---
    const { data: orgMembers, error: orgError } = await supabaseAdmin
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', mission.organization_id);

    if (orgError) throw orgError;
    const orgUserIds = orgMembers.map(m => m.user_id);

    const isVolunteer = user.id === volunteer_id;
    const isOrgMember = orgUserIds.includes(user.id);

    if (!isVolunteer && !isOrgMember) {
      throw new Error("You are not a participant in this mission.");
    }

    let updateData: any = {};
    let notificationUserId: string = '';
    let notificationMessage: string = '';

    // Check if this is the first closure initiation
    const isFirstClosure = !mission.org_closed && !mission.volunteer_closed;

    if (isVolunteer) {
      updateData.volunteer_closed = true;
      notificationUserId = orgUserIds[0]; // Notify the first org member
      notificationMessage = `The volunteer has marked mission "${mission.title}" as complete. Please review and confirm within 3 days.`;
    } else { // Is Org Member
      updateData.org_closed = true;
      notificationUserId = volunteer_id;
      notificationMessage = `The organization has marked mission "${mission.title}" as complete. Please review and confirm within 3 days.`;
    }

    // Set closure initiated timestamp and status only on first closure
    if (isFirstClosure) {
      updateData.closure_initiated_at = new Date().toISOString();
      updateData.status = 'pending_closure';
    }

    // --- 5. Update mission and create notification ---
    const { data: updatedMission, error: updateError } = await supabaseAdmin
      .from('missions')
      .update(updateData)
      .eq('id', mission_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Check if both parties have now closed the mission
    if (updatedMission.org_closed && updatedMission.volunteer_closed) {
      await supabaseAdmin.from('missions').update({ 
        status: 'completed',
        closed_at: new Date().toISOString()
      }).eq('id', mission_id);
    } else {
      // If not complete, send a notification to the other party
      await supabaseAdmin.from('notifications').insert({
        user_id: notificationUserId,
        message: notificationMessage,
        link_url: `/mission/${mission_id}`
      });

      // Send email notification for closure initiation
      try {
        // Get user details for email
        const { data: userProfile } = await supabaseAdmin
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('user_id', notificationUserId)
          .single();

        if (userProfile?.email) {
          const emailName = userProfile.first_name && userProfile.last_name 
            ? `${userProfile.first_name} ${userProfile.last_name}` 
            : userProfile.email;

          await supabaseAdmin.functions.invoke('send-mission-email', {
            body: {
              to: userProfile.email,
              name: emailName,
              subject: `Mission Completion Review Required - ${mission.title}`,
              missionTitle: mission.title,
              missionId: mission_id,
              emailType: 'closure_initiated',
              additionalData: {
                initiatorType: isVolunteer ? 'volunteer' : 'organization'
              }
            }
          });
        }
      } catch (emailError) {
        console.error('Error sending closure email:', emailError);
        // Don't fail the main operation if email fails
      }
    }

    return new Response(JSON.stringify({ success: true, data: updatedMission }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});