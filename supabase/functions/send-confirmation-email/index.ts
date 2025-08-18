import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Brevo email service configuration
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const BREVO_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL") || "noreply@shieldmate.app";
const BREVO_SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME") || "ShieldMate";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  confirmationUrl: string;
  firstName?: string;
  lastName?: string;
  userType: 'organization' | 'volunteer';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, confirmationUrl, firstName, lastName, userType }: EmailRequest = await req.json();

    const name = firstName && lastName ? `${firstName} ${lastName}` : email;
    const userTypeText = userType === 'organization' ? 'Organization' : 'Volunteer';

    const emailPayload = {
      sender: {
        email: BREVO_SENDER_EMAIL,
        name: BREVO_SENDER_NAME
      },
      to: [{ email, name }],
      subject: `Confirm your ${userTypeText} account`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">🛡️ ShieldMate</h1>
          </div>
          
          <h2 style="color: #333;">Welcome to ShieldMate, ${name}!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Thank you for registering as ${userType === 'organization' ? 'an organization' : 'a volunteer'} 
            on ShieldMate. To complete your registration and activate your account, please click the button below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Confirm Your Account
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          <p style="color: #2563eb; word-break: break-all; font-size: 14px;">
            ${confirmationUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px;">
            If you didn't create an account with ShieldMate, you can safely ignore this email.
          </p>
        </div>
      `
    };

    const emailResponse = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY!
      },
      body: JSON.stringify(emailPayload)
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      throw new Error(`Brevo API error: ${emailResponse.status} ${errorData}`);
    }

    const responseData = await emailResponse.json();

    console.log("Confirmation email sent successfully:", responseData);

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation-email function:", error);
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