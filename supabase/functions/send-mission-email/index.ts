import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Brevo email service configuration
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const BREVO_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL") || "noreply@shieldmate.app";
const BREVO_SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME") || "ShieldMate";
const PUBLIC_SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || "https://app.shieldmate.com";

interface MissionEmailRequest {
  to: string;
  name: string;
  subject: string;
  missionTitle: string;
  missionId: string;
  emailType: 'closure_initiated' | 'auto_closed' | 'application_accepted' | 'application_received';
  additionalData?: {
    initiatorType?: 'volunteer' | 'organization';
    organizationName?: string;
    volunteerName?: string;
  };
}

const getEmailContent = (
  missionTitle: string,
  missionId: string,
  emailType: string,
  name: string,
  additionalData?: any
): string => {
  const missionUrl = `${PUBLIC_SITE_URL}/mission/${missionId}`;
  
  switch (emailType) {
    case 'closure_initiated':
      const initiator = additionalData?.initiatorType === 'volunteer' ? 'volunteer' : 'organization';
      const otherParty = initiator === 'volunteer' ? 'organization' : 'volunteer';
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">🛡️ ShieldMate</h1>
          </div>
          
          <h2 style="color: #333;">Mission Completion Review Required</h2>
          
          <p style="color: #666; line-height: 1.6;">Hello ${name},</p>
          
          <p style="color: #666; line-height: 1.6;">
            The ${initiator} has marked the mission "<strong>${missionTitle}</strong>" as complete. 
            Please review and confirm the completion within 3 days to finalize the mission.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${missionUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Review Mission
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            <strong>Important:</strong> If you don't respond within 3 days, the mission will be automatically marked as completed.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px;">
            This is an automated notification from ShieldMate. Please do not reply to this email.
          </p>
        </div>
      `;
    
    case 'auto_closed':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">🛡️ ShieldMate</h1>
          </div>
          
          <h2 style="color: #333;">Mission Automatically Completed</h2>
          
          <p style="color: #666; line-height: 1.6;">Hello ${name},</p>
          
          <p style="color: #666; line-height: 1.6;">
            The mission "<strong>${missionTitle}</strong>" has been automatically marked as completed 
            due to no response within the 3-day review period.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${missionUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              View Mission Details
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Thank you for your participation in this mission. Your contribution is greatly appreciated!
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px;">
            This is an automated notification from ShieldMate. Please do not reply to this email.
          </p>
        </div>
      `;
    
    case 'application_accepted':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">🛡️ ShieldMate</h1>
          </div>
          
          <h2 style="color: #15803d;">Mission Application Accepted! 🎉</h2>
          
          <p style="color: #666; line-height: 1.6;">Hello ${name},</p>
          
          <p style="color: #666; line-height: 1.6;">
            Great news! Your application for the mission "<strong>${missionTitle}</strong>" 
            has been accepted by ${additionalData?.organizationName || 'the organization'}.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${missionUrl}" 
               style="background-color: #15803d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Start Mission
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            You can now access the mission details, communicate with the organization, and begin your volunteer work.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px;">
            This is an automated notification from ShieldMate. Please do not reply to this email.
          </p>
        </div>
      `;
    
    case 'application_received':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">🛡️ ShieldMate</h1>
          </div>
          
          <h2 style="color: #333;">New Mission Application Received</h2>
          
          <p style="color: #666; line-height: 1.6;">Hello ${name},</p>
          
          <p style="color: #666; line-height: 1.6;">
            You have received a new application for the mission "<strong>${missionTitle}</strong>" 
            from ${additionalData?.volunteerName || 'a volunteer'}.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${missionUrl}/applications" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Review Application
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Please review the application and respond to the volunteer soon.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px;">
            This is an automated notification from ShieldMate. Please do not reply to this email.
          </p>
        </div>
      `;
    
    default:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">🛡️ ShieldMate</h1>
          </div>
          
          <h2 style="color: #333;">Mission Update</h2>
          
          <p style="color: #666; line-height: 1.6;">Hello ${name},</p>
          
          <p style="color: #666; line-height: 1.6;">
            There has been an update regarding the mission "<strong>${missionTitle}</strong>".
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${missionUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              View Mission
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px;">
            This is an automated notification from ShieldMate. Please do not reply to this email.
          </p>
        </div>
      `;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, name, subject, missionTitle, missionId, emailType, additionalData }: MissionEmailRequest = await req.json();

    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is not configured");
    }

    const emailPayload = {
      sender: {
        email: BREVO_SENDER_EMAIL,
        name: BREVO_SENDER_NAME
      },
      to: [{ email: to, name }],
      subject,
      htmlContent: getEmailContent(missionTitle, missionId, emailType, name, additionalData)
    };

    const emailResponse = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY
      },
      body: JSON.stringify(emailPayload)
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      throw new Error(`Brevo API error: ${emailResponse.status} ${errorData}`);
    }

    const responseData = await emailResponse.json();
    console.log("Mission email sent successfully:", responseData);

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-mission-email function:", error);
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