/**
 * Email Queue Service
 *
 * Enqueues email messages for async processing via Cloudflare Queue.
 * In development mode (no queue bound), logs the email for debugging.
 */
import type { EmailQueueMessage } from '../types'

export class EmailService {
  constructor(private queue?: any) {} // Queue type when provisioned

  /**
   * Send a purchase receipt email via queue.
   */
  async sendPurchaseReceipt(params: {
    ticketUuid: string
    eventUuid: string
    toEmail: string
    eventName: string
    tierName: string
    ticketNumber: string
    legalName: string
    amountPaid: number
  }): Promise<void> {
    const message: EmailQueueMessage = {
      type: 'purchase_receipt',
      ticket_uuid: params.ticketUuid,
      event_uuid: params.eventUuid,
      to_email: params.toEmail,
      data: {
        event_name: params.eventName,
        tier_name: params.tierName,
        ticket_number: params.ticketNumber,
        legal_name: params.legalName,
        amount_paid: params.amountPaid,
      },
    }

    await this.enqueue(message)
  }

  /**
   * Send a redeem confirmation email via queue.
   */
  async sendRedeemConfirmation(params: {
    ticketUuid: string
    eventUuid: string
    toEmail: string
    eventName: string
    ticketNumber: string
    redeemedAt: string
  }): Promise<void> {
    const message: EmailQueueMessage = {
      type: 'redeem_confirmation',
      ticket_uuid: params.ticketUuid,
      event_uuid: params.eventUuid,
      to_email: params.toEmail,
      data: {
        event_name: params.eventName,
        ticket_number: params.ticketNumber,
        redeemed_at: params.redeemedAt,
      },
    }

    await this.enqueue(message)
  }

  private async enqueue(message: EmailQueueMessage): Promise<void> {
    if (this.queue) {
      await this.queue.send(message)
      console.log(`[EmailQueue] Enqueued: ${message.type} for ${message.to_email}`)
    } else {
      // Development fallback: log instead of sending
      console.log(`[EmailQueue:DEV] Would send ${message.type} to ${message.to_email}:`, JSON.stringify(message.data))
    }
  }
}
