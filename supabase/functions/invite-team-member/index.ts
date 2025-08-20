// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Admin client will be created after authorization check

interface InviteRequest {
  email: string;
  role: 'member' | 'owner';
  organizationId: string;
}

// Rate limiting storage (in production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = {
  MAX_REQUESTS: 5, // 5 invites per hour per IP
  WINDOW_MS: 60 * 60 * 1000, // 1 hour
};

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = `invite:${ip}`;
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT.WINDOW_MS });
    return true;
  }
  
  if (current.count >= RATE_LIMIT.MAX_REQUESTS) {
    return false;
  }
  
  current.count++;
  return true;
}

function sanitizeInput(input: string): string {
  return input.trim().slice(0, 255);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Rate limiting first
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(clientIP)) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
      {
        status: 429,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Window": "3600"
        },
      }
    );
  }

  // Verify authorization before creating any clients
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Authorization header required" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Create admin client only after auth verification
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const body = await req.json();
    const { email, role, organizationId }: InviteRequest = body;

    console.log(`Processing invite request for ${email} to org ${organizationId} from IP ${clientIP}`);

    // Input validation
    if (!email || !role || !organizationId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, role, organizationId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedRole = sanitizeInput(role);
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!['member', 'owner'].includes(sanitizedRole)) {
      return new Response(
        JSON.stringify({ error: "Invalid role. Must be 'member' or 'owner'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get current user from auth token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if caller is organization owner
    const { data: membership, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (memberError || !membership) {
      return new Response(
        JSON.stringify({ error: "You are not a member of this organization" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (membership.role !== 'owner') {
      return new Response(
        JSON.stringify({ error: "Only organization owners can invite members" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use RPC to safely handle existing user lookup and membership
    const { data: inviteResult, error: rpcError } = await supabaseAdmin
      .rpc('handle_team_invitation', {
        p_email: sanitizedEmail,
        p_role: sanitizedRole,
        p_organization_id: organizationId,
        p_inviter_user_id: user.id
      });

    if (rpcError) {
      console.error('RPC handle_team_invitation error:', rpcError);
      return new Response(
        JSON.stringify({ error: 'Failed to process invitation', details: rpcError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // inviteResult may be an array of rows returned by the function
    const resultRow = Array.isArray(inviteResult) ? inviteResult[0] : inviteResult;

    if (resultRow?.outcome === 'already_member') {
      return new Response(
        JSON.stringify({ error: 'User is already a member of this organization' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (resultRow?.outcome === 'added_existing_user') {
      console.log(`Existing user ${sanitizedEmail} successfully added to organization`);
      return new Response(
        JSON.stringify({ success: true, message: 'Existing user added to organization successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If outcome is 'send_invite', proceed to send invite email

    // User doesn't exist, send invitation
    const { data: orgData } = await supabaseAdmin
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      sanitizedEmail,
      {
        data: {
          is_org_invite: true,
          organization_id: organizationId,
          organization_name: orgData?.name || 'Organization',
          role: sanitizedRole,
        },
        redirectTo: `${req.headers.get('origin') || 'https://app.example.com'}/auth`
      }
    );

    if (inviteError) {
      console.error('Error sending invitation:', inviteError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send invitation",
          details: inviteError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Invitation sent successfully to ${sanitizedEmail}`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation sent successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error in invite-team-member function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
