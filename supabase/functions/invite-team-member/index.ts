// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Admin client for privileged operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface InviteRequest {
  orgId: string;
  orgName: string;
  inviteeEmail: string;
  inviteeRole: 'member' | 'owner';
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orgId, orgName, inviteeEmail, inviteeRole }: InviteRequest = await req.json();

    // 1. --- VERIFY CALLER IS AN ORGANIZATION OWNER ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header");

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not found");

    // Check if the calling user is an owner of the specified organization
    const { data: membership, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', orgId)
      .single();

    if (memberError) throw new Error("You are not a member of this organization.");
    if (membership.role !== 'owner') throw new Error("Unauthorized: Only owners can invite new members.");
    // --- END OF SECURITY CHECK ---


    // 2. --- CHECK IF INVITEE IS ALREADY A MEMBER ---
    // Check if a user with this email already exists
    const { data: existingUser, error: existingUserError } = await supabaseAdmin.auth.admin.listUsers();
    const userWithEmail = existingUser.users?.find(u => u.email === inviteeEmail);
    if (userWithEmail) {
        // User exists, check if they are already in the organization
        const { data: existingMember, error: existingMemberError } = await supabaseAdmin
            .from('organization_members')
            .select('id')
            .eq('user_id', userWithEmail.id)
            .eq('organization_id', orgId)
            .single();

        if (existingMember) {
            throw new Error("This user is already a member of the organization.");
        }
    }
    // --- END OF DUPLICATE CHECK ---


    // 3. --- SEND INVITATION ---
    const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      inviteeEmail,
      {
        data: {
          // Metadata that will be available when the user signs up
          is_org_invite: true,
          organization_id: orgId,
          organization_name: orgName,
          role: inviteeRole,
        }
      }
    );

    if (inviteError) throw inviteError;

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in invite-team-member function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
