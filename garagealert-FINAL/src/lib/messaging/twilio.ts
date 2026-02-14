import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function sendSMS(to: string, body: string) {
  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to, // Must be E.164 format: +447xxxxxxxxx
    })
    return {
      success: true,
      sid: message.sid,
      status: message.status,
    }
  } catch (error: any) {
    console.error('SMS send failed:', error.message)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function sendWhatsApp(to: string, body: string) {
  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_WHATSAPP_NUMBER!, // whatsapp:+14155238886
      to: `whatsapp:${to}`, // whatsapp:+447xxxxxxxxx
    })
    return {
      success: true,
      sid: message.sid,
      status: message.status,
    }
  } catch (error: any) {
    console.error('WhatsApp send failed:', error.message)
    return {
      success: false,
      error: error.message,
    }
  }
}
