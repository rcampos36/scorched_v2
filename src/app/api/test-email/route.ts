import { NextRequest, NextResponse } from 'next/server'

// Test endpoint to verify email configuration
export async function GET(request: NextRequest) {
  try {
    // Allow access for testing (can be restricted later if needed)
    const authCookie = request.cookies.get('admin-auth')
    const isAuthenticated = authCookie && authCookie.value === 'authenticated'
    
    // Log access for debugging
    if (!isAuthenticated) {
      console.warn('⚠️ Test email endpoint accessed without authentication')
    }

    const resendApiKey = process.env.RESEND_API_KEY
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const sendgridApiKey = process.env.SENDGRID_API_KEY
    const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL

    // Get test email from query parameter
    const testEmail = request.nextUrl.searchParams.get('email') || 'test@example.com'

    // Check all email-related environment variables
    const allEnvVars = Object.keys(process.env)
    const emailEnvVars = allEnvVars.filter(key => 
      key.toUpperCase().includes('RESEND') || 
      key.toUpperCase().includes('SENDGRID') || 
      key.toUpperCase().includes('EMAIL')
    )
    
    const config = {
      resend: {
        configured: !!resendApiKey,
        apiKeyLength: resendApiKey?.length || 0,
        fromEmail: resendFromEmail,
        apiKeyPrefix: resendApiKey ? `${resendApiKey.substring(0, 10)}...` : 'not set',
        envVarFound: allEnvVars.includes('RESEND_API_KEY'),
        envVarName: allEnvVars.find(k => k.toUpperCase() === 'RESEND_API_KEY') || 'NOT FOUND'
      },
      sendgrid: {
        configured: !!sendgridApiKey,
        apiKeyLength: sendgridApiKey?.length || 0,
        fromEmail: sendgridFromEmail || 'not set',
        apiKeyPrefix: sendgridApiKey ? `${sendgridApiKey.substring(0, 10)}...` : 'not set',
        envVarFound: allEnvVars.includes('SENDGRID_API_KEY'),
        envVarName: allEnvVars.find(k => k.toUpperCase() === 'SENDGRID_API_KEY') || 'NOT FOUND'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV || 'not set',
        vercelUrl: process.env.VERCEL_URL || 'not set',
        allEmailRelatedVars: emailEnvVars.map(key => ({
          name: key,
          set: !!process.env[key],
          length: process.env[key]?.length || 0
        })),
        // Check if ANY PayPal vars are available (to confirm env vars work at all)
        paypalVarsAvailable: Object.keys(process.env).filter(k => k.includes('PAYPAL')).length,
        allEnvVarCount: Object.keys(process.env).length
      }
    }

    // Try sending a test email if Resend is configured
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: resendFromEmail,
            to: testEmail,
            subject: 'Test Email from Scorched Fabrics',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #ec4899;">Test Email</h1>
                <p>This is a test email from your Scorched Fabrics application.</p>
                <p>If you received this email, your email configuration is working correctly! ✅</p>
                <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
            `,
          }),
        })

        const responseText = await response.text()
        let responseData

        try {
          responseData = JSON.parse(responseText)
        } catch {
          responseData = { raw: responseText }
        }

        if (!response.ok) {
          return NextResponse.json({
            config,
            testResult: {
              success: false,
              error: responseData.message || responseData.error || responseText,
              status: response.status,
              details: responseData
            },
            suggestion: 'Check your RESEND_API_KEY and RESEND_FROM_EMAIL. Make sure the API key is valid and the from email is verified in Resend.'
          })
        }

        return NextResponse.json({
          config,
          testResult: {
            success: true,
            message: `Test email sent successfully to ${testEmail}`,
            emailId: responseData.id,
            details: responseData
          }
        })
      } catch (error: any) {
        return NextResponse.json({
          config,
          testResult: {
            success: false,
            error: error.message || 'Failed to send test email',
            details: error.toString()
          }
        })
      }
    }

    return NextResponse.json({
      config,
      testResult: {
        success: false,
        message: 'No email service configured',
        suggestion: 'Add RESEND_API_KEY and RESEND_FROM_EMAIL to Vercel environment variables and redeploy.'
      },
      troubleshooting: {
        step1: 'Go to Vercel Dashboard → Your Project → Settings → Environment Variables',
        step2: 'Add RESEND_API_KEY with your Resend API key (starts with "re_")',
        step3: 'Add RESEND_FROM_EMAIL with your verified email address (e.g., noreply@yourdomain.com)',
        step4: 'Make sure variables are set for "Production" environment (or all environments)',
        step5: 'Redeploy your application after adding variables (Vercel → Deployments → Redeploy)',
        step6: 'Variable names are case-sensitive: RESEND_API_KEY and RESEND_FROM_EMAIL',
        note: 'Environment variables are only loaded on deployment. You MUST redeploy after adding them!'
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error.message || error.toString()
      },
      { status: 500 }
    )
  }
}
