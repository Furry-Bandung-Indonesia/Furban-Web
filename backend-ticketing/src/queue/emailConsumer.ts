/**
 * Queue Consumer — Email Processing
 *
 * Processes email messages from the ticketing-email-queue.
 * In production, this connects to an SMTP service.
 * For development, it logs the emails.
 */
import type { EmailQueueMessage } from '../types'

/**
 * Queue message handler.
 * This is exported and used as the queue consumer in wrangler.toml.
 */
export async function handleEmailQueue(
  batch: MessageBatch<EmailQueueMessage>,
  env: Record<string, any>,
): Promise<void> {
  for (const message of batch.messages) {
    try {
      const msg = message.body
      console.log(`[EmailQueue] Processing: ${msg.type} → ${msg.to_email}`)

      switch (msg.type) {
        case 'purchase_receipt':
          await sendPurchaseReceiptEmail(msg, env)
          break
        case 'redeem_confirmation':
          await sendRedeemConfirmationEmail(msg, env)
          break
        default:
          console.warn(`[EmailQueue] Unknown message type: ${(msg as any).type}`)
      }

      // Acknowledge message
      message.ack()
    } catch (e: any) {
      console.error(`[EmailQueue] Error processing message:`, e)

      // Retry up to 3 times
      if (message.attempts < 3) {
        message.retry()
      } else {
        console.error(`[EmailQueue] Message exhausted retries, discarding`)
        message.ack()
      }
    }
  }
}

// ─── Email Builders ──────────────────────────────────

async function sendPurchaseReceiptEmail(msg: EmailQueueMessage, env: Record<string, any>) {
  const { event_name, tier_name, ticket_number, legal_name, amount_paid } = msg.data

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>🎫 Ticket Purchase Confirmation</h2>
      <p>Hi <strong>${legal_name}</strong>,</p>
      <p>Your ticket has been confirmed!</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Event</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${event_name}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Tier</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${tier_name}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Ticket #</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${ticket_number}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Amount</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">Rp ${Number(amount_paid).toLocaleString('id-ID')}</td></tr>
      </table>
      <p style="margin-top: 20px;">Please keep this ticket number safe. You'll need to show your QR code at the event.</p>
      <p style="color: #666;">— Furban Ticketing</p>
    </div>
  `

  // In production, send via SMTP
  // For now, log and optionally store in R2
  console.log(`[Email:PurchaseReceipt] To: ${msg.to_email}, Ticket: ${ticket_number}`)

  if (env.BUCKET) {
    try {
      await env.BUCKET.put(
        `email_receipts/${msg.ticket_uuid}_receipt.html`,
        html,
        { httpMetadata: { contentType: 'text/html' } },
      )
    } catch (e) {
      console.error('[Email] Failed to store receipt in R2:', e)
    }
  }
}

async function sendRedeemConfirmationEmail(msg: EmailQueueMessage, env: Record<string, any>) {
  const { event_name, ticket_number, redeemed_at } = msg.data

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>✅ Check-In Confirmation</h2>
      <p>Your ticket <strong>${ticket_number}</strong> for <strong>${event_name}</strong> has been checked in.</p>
      <p>Check-in time: ${new Date(redeemed_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</p>
      <p>Enjoy the event! 🎉</p>
      <p style="color: #666;">— Furban Ticketing</p>
    </div>
  `

  console.log(`[Email:RedeemConfirmation] To: ${msg.to_email}, Ticket: ${ticket_number}`)
}
