// supabase/functions/set-volunteer-skills/index.ts

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Admin client for privileged operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface SetSkillsRequest {
  volunteerId: string;
  skillIds: string[];
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. --- VERIFY CALLER IS A SUPER ADMIN ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header");

    const userClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw userError || new Error("User not found");

    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) throw rolesError;

    const isSuperAdmin = userRoles?.some(r => r.role === 'super_admin');
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized: Not a super admin" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // --- END OF SECURITY CHECK ---

    // 2. --- PROCEED WITH SKILL UPDATE ---
    const { volunteerId, skillIds }: SetSkillsRequest = await req.json();
    if (!volunteerId || !Array.isArray(skillIds)) {
      throw new Error("Invalid request body: volunteerId and skillIds array are required.");
    }

    // --- DB TRANSACTION: Delete old skills, then insert new ones ---
    // This ensures the operation is atomic.
    const { error: rpcError } = await supabaseAdmin.rpc('set_volunteer_skills_atomic', {
      p_volunteer_id: volunteerId,
      p_skill_ids: skillIds,
      p_admin_id: user.id
    });

    if (rpcError) throw rpcError;

    return new Response(JSON.stringify({ success: true, message: "Volunteer skills updated successfully." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in set-volunteer-skills function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/* Note: For this function to work, you need to create a PostgreSQL function in your database.
  Go to the Supabase SQL Editor and run the following command once:

  CREATE OR REPLACE FUNCTION set_volunteer_skills_atomic(p_volunteer_id UUID, p_skill_ids UUID[], p_admin_id UUID)
  RETURNS void AS $$
  BEGIN
    -- Delete existing skills for the volunteer
    DELETE FROM public.volunteer_skills WHERE volunteer_id = p_volunteer_id;

    -- Insert new skills if the array is not empty
    IF array_length(p_skill_ids, 1) > 0 THEN
      INSERT INTO public.volunteer_skills (volunteer_id, skill_id, assigned_by)
      SELECT p_volunteer_id, unnest(p_skill_ids), p_admin_id;
    END IF;
  END;
  $$ LANGUAGE plpgsql;

*/
