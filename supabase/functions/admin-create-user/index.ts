import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'volunteer' | 'organization_owner';
  bio?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client
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

    const { email, password, firstName, lastName, role, bio }: CreateUserRequest = await req.json();

    // Create user with admin privileges
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      },
      email_confirm: true // Auto-confirm email
    });

    if (userError) {
      throw userError;
    }

    if (userData.user) {
      // Update profile with bio if provided
      if (bio) {
        await supabaseAdmin
          .from('profiles')
          .update({ bio })
          .eq('user_id', userData.user.id);
      }

      // Assign the specified role
      await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userData.user.id,
          role: role
        });

      console.log(`User created successfully: ${userData.user.email} with role ${role}`);

      return new Response(JSON.stringify({ 
        success: true, 
        user: {
          id: userData.user.id,
          email: userData.user.email,
          first_name: firstName,
          last_name: lastName,
          role: role
        }
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    throw new Error('User creation failed');

  } catch (error: any) {
    console.error("Error in admin-create-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);