/**
 * Default Terms & Conditions template for ticketing events.
 *
 * Event organizers can load this as a starting point when creating
 * a new event via EventConfigPanel → "Load Default Template".
 *
 * The HTML is stored in the event's `tos_text` field and displayed
 * to attendees during ticket claim (TicketClaim.vue).
 */
export const defaultEventTos = `
<h2>Event Terms & Conditions</h2>

<p>By purchasing a ticket and attending this event organised on the Furban platform, you ("Attendee") agree to the following terms. These are supplementary to the platform-wide <a href="/terms-of-service" target="_blank">Terms of Service</a> and <a href="/privacy-policy" target="_blank">Privacy Policy</a>.</p>

<h3>1. Tickets & Modifications</h3>

<p>Tickets are issued only after payment confirmation and are personal and non-transferable unless authorised by the organiser. Attendees must provide accurate personal information during registration — false information may result in entry denial and ticket revocation without refund. The organiser reserves the right to limit ticket sales, modify schedules, change the venue, or alter programming at any time and will endeavour to notify ticket holders of material changes in advance.</p>

<h3>2. Cancellation, Refund & Revocation</h3>

<p>If the event is cancelled by the organiser, ticket holders are entitled to a full refund. Attendee-initiated cancellations are subject to the organiser's refund policy and no-shows are not eligible for refunds. The organiser and/or Furban reserve the right to revoke any ticket if the Attendee provided false information, engaged in scalping or unauthorised transfer, violated the code of conduct, engaged in harassment or misconduct, attempted to forge QR codes or circumvent security, or appears on a moderation or ban list. <strong>Revoked tickets are void and non-refundable.</strong></p>

<h3>3. Fraud Prevention, Enforcement & Liability</h3>

<p>Any attempt to manipulate the ticketing system — including automated purchasing, QR forgery, account impersonation, or exploiting vulnerabilities — is strictly prohibited. <strong>Failure to comply may result in immediate ticket revocation without refund and permanent deregistration (ban) of the Attendee's account on the Furban platform.</strong> Consequences are applied at the sole discretion of the organiser or platform and may range from a warning to permanent account ban. The platform reserves the right to report illegal activities to law enforcement. The organiser and Furban are not liable for any injury, loss, or damage except where caused by gross negligence. Attendance is at the Attendee's own risk.</p>

<h3>4. Privacy & General</h3>

<p>The event may be photographed or recorded for promotional purposes; by attending, you consent to your likeness being used in event media. Personal data is processed per the Furban <a href="/privacy-policy" target="_blank">Privacy Policy</a> and may be shared with the organiser for event management only. The organiser may amend these terms before the event — continued possession of a ticket constitutes acceptance. By completing your purchase, you acknowledge that you have read and agreed to these terms.</p>
`.trim()
