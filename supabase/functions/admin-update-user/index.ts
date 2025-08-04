// supabase/functions/admin-update-user/index.ts

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Admin client for privileged operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface UpdateUserRequest {
  userId: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
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
    const { data: { user: adminUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !adminUser) throw userError || new Error("Admin user not found");
    const { data: userRoles, error: rolesError } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', adminUser.id);
    if (rolesError) throw rolesError;
    const isSuperAdmin = userRoles?.some(r => r.role === 'super_admin');
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized: Not a super admin" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // --- END OF SECURITY CHECK ---

    // 2. --- PROCEED WITH USER UPDATE ---
    const { userId, email, password, firstName, lastName, bio }: UpdateUserRequest = await req.json();
    if (!userId) throw new Error("User ID is required.");

    // Update Auth data if provided
    const authUpdatePayload: any = {};
    if (email) authUpdatePayload.email = email;
    if (password) authUpdatePayload.password = password;
    if (Object.keys(authUpdatePayload).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdatePayload);
      if (authError) throw authError;
    }

    // Update Profile data if provided
    const profileUpdatePayload: any = {};
    if (firstName) profileUpdatePayload.first_name = firstName;
    if (lastName) profileUpdatePayload.last_name = lastName;
    if (bio !== undefined) profileUpdatePayload.bio = bio; // Allow empty string
    if (Object.keys(profileUpdatePayload).length > 0) {
        const { error: profileError } = await supabaseAdmin.from('profiles').update(profileUpdatePayload).eq('user_id', userId);
        if (profileError) throw profileError;
    }

    return new Response(JSON.stringify({ success: true, message: "User updated successfully." }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in admin-update-user function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
