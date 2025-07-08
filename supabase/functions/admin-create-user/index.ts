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
  role: 'volunteer' | 'organization_owner' | 'super_admin';
  bio?: string;
}

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

// Auto-create super admin on function deployment
(async () => {
  console.log('Checking for super admin user...');
  
  try {
    // Check if super admin already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'super_admin')
      .limit(1);

    if (!existingAdmin || existingAdmin.length === 0) {
      console.log('No super admin found, creating one...');
      
      // Create super admin user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: 'homerf@spellshield.com.au',
        password: '9tZHY!ChXD5X7^b6eMPh',
        email_confirm: true,
        user_metadata: {
          first_name: 'Homer',
          last_name: 'F',
        }
      });

      if (authError && !authError.message.includes('already registered')) {
        console.error('Failed to create super admin:', authError);
        return;
      }

      let userId = authData?.user?.id;
      
      // If user already exists, get their ID
      if (authError?.message.includes('already registered')) {
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const user = existingUser.users.find(u => u.email === 'homerf@spellshield.com.au');
        userId = user?.id;
      }

      if (userId) {
        // Create profile
        await supabaseAdmin
          .from('profiles')
          .upsert({
            user_id: userId,
            first_name: 'Homer',
            last_name: 'F'
          });

        // Assign super admin role
        await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: 'super_admin'
          });

        console.log('Super admin created successfully');
      }
    } else {
      console.log('Super admin already exists');
    }
  } catch (error) {
    console.error('Error setting up super admin:', error);
  }
})();

serve(handler);