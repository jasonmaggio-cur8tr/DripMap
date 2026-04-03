import React from 'react';

const EFFECTIVE_DATE = 'April 3, 2026';
const CONTACT_EMAIL = 'legal@dripmap.space';
const APP_URL = 'https://dripmap.space';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-coffee-50">
      {/* Hero */}
      <div className="bg-coffee-900 text-white px-6 py-16 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-10 bg-volt-400 rounded-xl flex items-center justify-center">
            <i className="fa-solid fa-file-contract text-coffee-900 text-lg" />
          </div>
          <span className="font-bold text-2xl tracking-tight">DripMap</span>
        </div>
        <h1 className="text-4xl font-black mb-3">Terms of Service</h1>
        <p className="text-coffee-300 text-sm">Effective Date: {EFFECTIVE_DATE}</p>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-14 space-y-10">

        {/* Intro */}
        <section>
          <p className="text-coffee-800 text-lg leading-relaxed">
            Welcome to DripMap. By downloading, installing, or using the DripMap mobile application or website (the "Service"), you agree to these Terms of Service ("Terms"). Please read them carefully. If you do not agree to these Terms, do not use the Service.
          </p>
        </section>

        <Section title="1. Acceptance of Terms">
          <p>
            These Terms form a legally binding agreement between you and DripMap ("we," "us," or "our"). By creating an account or using any part of the Service, you confirm that you are at least 17 years old and agree to be bound by these Terms and our <a href="#/privacy" className="text-volt-600 font-semibold underline">Privacy Policy</a>.
          </p>
        </Section>

        <Section title="2. Your Account">
          <ul>
            <li>You must provide accurate information when creating an account.</li>
            <li>You are responsible for maintaining the confidentiality of your password and for all activity under your account.</li>
            <li>You must not share your account credentials with others.</li>
            <li>Notify us immediately at <a href={`mailto:${CONTACT_EMAIL}`} className="text-volt-600 font-semibold underline">{CONTACT_EMAIL}</a> if you believe your account has been compromised.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
          </ul>
        </Section>

        <Section title="3. User-Generated Content">
          <p>
            DripMap allows you to post photos, reviews, ratings, and other content ("User Content"). By submitting User Content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, reproduce, and distribute your content within the Service.
          </p>
          <SubSection title="You agree NOT to post content that:">
            <ul>
              <li>Is false, misleading, or defamatory</li>
              <li>Infringes the intellectual property rights of others</li>
              <li>Contains nudity, graphic violence, or sexually explicit material</li>
              <li>Harasses, threatens, or demeans other users</li>
              <li>Promotes illegal activity</li>
              <li>Contains spam, advertising, or unsolicited promotions</li>
              <li>Is uploaded without the consent of individuals pictured</li>
            </ul>
          </SubSection>
          <p>
            We reserve the right to remove any content that violates these Terms, without notice. You retain ownership of your content, but you are solely responsible for it.
          </p>
        </Section>

        <Section title="4. POURN Feature">
          <p>
            The POURN feature allows you to photograph and share drinks from coffee shops. When using this feature:
          </p>
          <ul>
            <li>Only post photos you have taken yourself or have rights to share</li>
            <li>Do not post photos that include identifiable individuals without their consent</li>
            <li>Posts should be genuine — do not fabricate experiences or misrepresent shops</li>
            <li>We may remove POURNs that violate these Terms or our community standards</li>
          </ul>
        </Section>

        <Section title="5. Shop Listings &amp; Reviews">
          <ul>
            <li>Shop information must be accurate to the best of your knowledge</li>
            <li>Reviews and experience logs must reflect your genuine personal experience</li>
            <li>Do not submit fake reviews, reviews for shops you have not visited, or reviews intended to harm a competitor</li>
            <li>Shop owners who claim listings are responsible for keeping their information accurate</li>
            <li>DripMap is not responsible for the accuracy of user-submitted shop data or reviews</li>
          </ul>
        </Section>

        <Section title="6. DripClub Subscriptions &amp; Payments">
          <ul>
            <li>DripClub is a paid subscription available to individual users</li>
            <li>Shop Pro and Shop Pro+ are paid subscriptions available to coffee shop owners</li>
            <li>All purchases are processed through the Apple App Store and are subject to Apple's own Terms of Service</li>
            <li>Subscription fees are billed to your Apple ID account at confirmation of purchase</li>
            <li>Subscriptions automatically renew unless cancelled at least 24 hours before the end of the billing period</li>
            <li>You can manage or cancel your subscription in your Apple ID account settings</li>
            <li><strong>Refunds:</strong> All refund requests are handled by Apple. We do not process refunds directly. Contact Apple Support for refund requests.</li>
            <li>We reserve the right to change subscription pricing with reasonable notice</li>
          </ul>
        </Section>

        <Section title="7. Acceptable Use">
          <p>You agree not to:</p>
          <ul>
            <li>Scrape, crawl, or systematically download content from the Service</li>
            <li>Use automated bots or scripts to interact with the Service</li>
            <li>Reverse engineer, decompile, or disassemble the app</li>
            <li>Attempt to gain unauthorized access to other accounts or our servers</li>
            <li>Use the Service for any unlawful purpose</li>
            <li>Interfere with or disrupt the integrity or performance of the Service</li>
          </ul>
        </Section>

        <Section title="8. Intellectual Property">
          <p>
            The DripMap name, logo, app design, and all non-user-generated content are owned by or licensed to us and protected by copyright, trademark, and other intellectual property laws. You may not use our branding without our written permission.
          </p>
        </Section>

        <Section title="9. Disclaimers">
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. WE DISCLAIM ALL WARRANTIES INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p>
            DripMap does not endorse any particular coffee shop, product, or user. We are not responsible for the quality, safety, or accuracy of any shop listing, review, or user-generated content.
          </p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>
            TO THE FULLEST EXTENT PERMITTED BY LAW, DRIPMAP SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM.
          </p>
        </Section>

        <Section title="11. Indemnification">
          <p>
            You agree to indemnify, defend, and hold harmless DripMap and its officers, directors, employees, and agents from and against any claims, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising from: (a) your use of the Service; (b) your User Content; (c) your violation of these Terms; or (d) your violation of any rights of a third party.
          </p>
        </Section>

        <Section title="12. Termination">
          <p>
            We may suspend or terminate your access to the Service at any time, with or without cause, with or without notice. Upon termination, your right to use the Service will immediately cease. Sections 3 (license grant for existing content), 8, 9, 10, 11, and 13 will survive termination.
          </p>
          <p>
            You may delete your account at any time from the Profile → Settings → Delete Account option, or by contacting us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-volt-600 font-semibold underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="13. Governing Law &amp; Disputes">
          <p>
            These Terms are governed by the laws of the United States. Any disputes arising from these Terms or the Service shall be resolved through binding arbitration in accordance with the American Arbitration Association's Consumer Arbitration Rules, except that either party may seek injunctive relief in a court of competent jurisdiction for intellectual property violations.
          </p>
          <p>
            You waive any right to bring claims as a class action or class arbitration.
          </p>
        </Section>

        <Section title="14. Changes to These Terms">
          <p>
            We may update these Terms from time to time. We will notify you of material changes by updating the Effective Date and, where appropriate, providing in-app notice. Your continued use of the Service after changes are posted constitutes your acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="15. Contact Us">
          <p>Questions about these Terms? Contact us:</p>
          <div className="mt-4 p-5 bg-white rounded-2xl border border-coffee-100">
            <p className="font-bold text-coffee-900">DripMap</p>
            <p className="text-coffee-800">Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-volt-600 font-semibold underline">{CONTACT_EMAIL}</a></p>
            <p className="text-coffee-800">Website: <a href={APP_URL} className="text-volt-600 font-semibold underline">{APP_URL}</a></p>
          </div>
        </Section>

        {/* Footer links */}
        <div className="pt-8 border-t border-coffee-100 flex flex-col sm:flex-row gap-4 items-center justify-between text-sm text-coffee-800">
          <span>© {new Date().getFullYear()} DripMap. All rights reserved.</span>
          <a href="#/privacy" className="hover:text-coffee-900 font-semibold transition-colors">Privacy Policy →</a>
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-black text-coffee-900 border-l-4 border-volt-400 pl-4">{title}</h2>
      <div className="text-coffee-800 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:space-y-2 [&_li]:leading-relaxed [&_strong]:text-coffee-900 [&_a]:text-volt-600">
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-bold text-coffee-900 text-lg">{title}</h3>
      <div className="[&_ul]:list-disc [&_ul]:ml-6 [&_ul]:space-y-2 [&_li]:leading-relaxed [&_strong]:text-coffee-900">
        {children}
      </div>
    </div>
  );
}
