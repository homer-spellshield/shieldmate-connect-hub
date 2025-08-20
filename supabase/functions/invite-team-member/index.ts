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

  // Rate limiting
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(clientIP)) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await req.json();
    const { orgId, orgName, inviteeEmail, inviteeRole }: InviteRequest = body;

    // Input validation and sanitization
    if (!orgId || !orgName || !inviteeEmail || !inviteeRole) {
      throw new Error("Missing required fields");
    }

    const sanitizedOrgName = sanitizeInput(orgName);
    const sanitizedEmail = sanitizeInput(inviteeEmail).toLowerCase();
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      throw new Error("Invalid email format");
    }

    if (!['member', 'owner'].includes(inviteeRole)) {
      throw new Error("Invalid role specified");
    }

    console.log(`Processing invite request for ${sanitizedEmail} to org ${orgId} from IP ${clientIP}`);

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
    const userWithEmail = existingUser.users?.find(u => u.email === sanitizedEmail);
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
      sanitizedEmail,
      {
        data: {
          // Metadata that will be available when the user signs up
          is_org_invite: true,
          organization_id: orgId,
          organization_name: sanitizedOrgName,
          role: inviteeRole,
        }
      }
    );

    console.log(`Invitation sent successfully to ${sanitizedEmail}`);

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
