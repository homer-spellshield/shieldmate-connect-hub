import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Admin client for interacting with Supabase with service_role privileges
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Interface for the expected request body
interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'volunteer' | 'organization_owner'; // Removed 'super_admin' from this type
  bio?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. --- VERIFY CALLER IS A SUPER ADMIN ---
    // Create a Supabase client with the user's authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    const userClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
    );

    // Get the user from the token
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not found");

    // Check if the user has the 'super_admin' role
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


    // 2. --- PROCEED WITH USER CREATION ---
    const { email, password, firstName, lastName, role, bio }: CreateUserRequest = await req.json();

    // Prevent creating another super_admin via this function
    if ((role as string) === 'super_admin') {
        throw new Error("Cannot create a super_admin using this function.");
    }

    // Create user with admin privileges
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      },
      email_confirm: true // Auto-confirm email since it's an admin action
    });

    if (createUserError) throw createUserError;

    if (newUser.user) {
      // The `handle_new_user` trigger in the database will create the profile.
      // We just need to add the role and optional bio.

      // Add bio to the profile if provided
      if (bio) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ bio })
          .eq('user_id', newUser.user.id);
        if (profileError) console.error("Error updating bio:", profileError.message);
      }

      // Assign the specified role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: role
        });
      if (roleError) throw roleError;

      console.log(`User created successfully by admin: ${newUser.user.email} with role ${role}`);

      return new Response(JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          first_name: firstName,
          last_name: lastName,
          role: role
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error('User creation failed for an unknown reason.');

  } catch (error: any) {
    console.error("Error in admin-create-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
