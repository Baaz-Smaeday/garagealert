import * as postmark from 'postmark'

const client = new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN!)

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  garageName: string
) {
  try {
    const response = await client.sendEmail({
      From: process.env.POSTMARK_FROM_EMAIL!,
      To: to,
      Subject: subject,
      TextBody: body,
      Tag: 'reminder',
      MessageStream: 'outbound',
    })
    return {
      success: true,
      messageId: response.MessageID,
    }
  } catch (error: any) {
    console.error('Email send failed:', error.message)
    return {
      success: false,
      error: error.message,
    }
  }
}
