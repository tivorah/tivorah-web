# Tivorah legal and trust readiness

This is an operational checklist, not legal advice. Public wording must stay aligned with
what the product and team actually do. Review it with an Australian technology/privacy
lawyer before accepting public accounts, payments or marketplace transactions.

## Must complete before public launch

- [ ] Confirm the legal operator: registered entity or proprietor name, ABN/ACN, business
  address and service contact. Add the exact details to the Terms, Privacy Policy,
  transactional receipts and commercial email footer.
- [ ] Obtain written advice on whether Tivorah is an age-restricted social media platform
  under the Online Safety Act. Tivorah requires users to be 18+, but wording alone is not
  age assurance. Implement and document proportionate checks, anti-circumvention,
  underage-account reporting, review and data-export/deletion handling.
- [ ] Determine which Online Safety industry code applies. Assign an owner for risk
  assessments, complaints, preservation, regulator notices and any annual compliance report.
- [ ] Complete a privacy impact assessment covering Hubs that reveal sensitive information,
  precise location, encrypted and unencrypted chat, job documents, moderation reports,
  Apple sign-in, analytics and Stripe Connect.
- [ ] Verify the actual hosting region, overseas recipient countries, contracts and data
  processing terms for Aiven, Redis Cloud, Cloudflare R2, transitional ImageKit storage, Resend, Stripe, Expo, PostHog,
  Cloudflare and Netlify. Update the Privacy Policy when providers or regions change.
- [ ] Approve and automate a record-retention schedule for accounts, messages, reports,
  transaction/tax records, job documents, audit logs, waitlist entries and backups. Test
  account deletion and restoration boundaries against that schedule.
- [ ] Test `support@tivorah.com` and `privacy@tivorah.com`, assign monitored owners and
  document escalation for imminent threats, child exploitation, image-based abuse,
  fraud, privacy complaints, legal requests and moderation appeals.
- [ ] Enable Netlify form detection and notifications. Until the public API is deployed,
  reconcile `tivorah-waitlist` and `tivorah-unsubscribe` submissions promptly. Marketing
  opt-outs must be applied to the master suppression list within five working days.
- [ ] Configure every marketing message to show the correct legal sender and contact
  details, preserve proof of consent, and include an unsubscribe that works for at least
  30 days without requiring login or additional personal information.
- [ ] Before enabling paid tickets or other payments, show total price and fees before
  checkout, identify the supplier, publish accurate cancellation/refund terms, issue
  receipts and test Stripe refund and dispute workflows. Never describe statutory
  Australian Consumer Law rights as optional.
- [ ] Have Australian counsel review the Marketplace Partner Agreement, the decision to
  identify connected organisers/providers as settlement merchants, Tivorah's remaining
  destination-charge and negative-balance exposure, refund authority, indemnity and
  liability wording. Confirm the Stripe account configuration matches the public wording.
- [ ] Have an Australian tax adviser determine Tivorah's GST invoicing and Sharing Economy
  Reporting Regime obligations for item, service and event transactions. Collect only the
  Partner identity fields that are lawfully required and document the reporting workflow.
- [ ] Ensure “verified”, “trusted”, “safe” and endorsement claims describe exactly what was
  checked. Hub membership and email verification are not identity, qualification,
  migration-agent, right-to-work or background checks.
- [ ] Reconcile Apple App Store and Google Play privacy disclosures with the final data
  inventory and test the public account-deletion route from the store listing.
- [ ] Maintain a Notifiable Data Breaches response plan with decision owners, evidence,
  assessment deadlines and OAIC/user notification templates.
- [ ] Confirm appropriate business, cyber, professional and public-liability insurance with
  a qualified broker for community, marketplace and event activity.

## Authoritative references

- OAIC APP 1 guidance: https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-1-app-1-open-and-transparent-management-of-personal-information
- OAIC privacy policy guide: https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/more-guidance/guide-to-developing-an-app-privacy-policy
- eSafety industry regulation: https://www.esafety.gov.au/about-us/industry-regulation
- eSafety social media minimum age guidance: https://www.esafety.gov.au/about-us/industry-regulation/social-media-age-restrictions/faqs
- ACMA spam compliance: https://www.acma.gov.au/avoid-sending-spam
- ACCC online buying and marketplaces: https://www.accc.gov.au/consumers/buying-products-and-services/buying-online
