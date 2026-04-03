import React from 'react';

const EFFECTIVE_DATE = 'April 3, 2026';
const COMPANY = 'DripMap';
const CONTACT_EMAIL = 'privacy@dripmap.space';
const APP_URL = 'https://dripmap.space';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-coffee-50">
      {/* Hero */}
      <div className="bg-coffee-900 text-white px-6 py-16 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-10 bg-volt-400 rounded-xl flex items-center justify-center">
            <i className="fa-solid fa-shield-halved text-coffee-900 text-lg" />
          </div>
          <span className="font-bold text-2xl tracking-tight">DripMap</span>
        </div>
        <h1 className="text-4xl font-black mb-3">Privacy Policy</h1>
        <p className="text-coffee-300 text-sm">Effective Date: {EFFECTIVE_DATE}</p>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-14 space-y-10">

        {/* Intro */}
        <section>
          <p className="text-coffee-800 text-lg leading-relaxed">
            {COMPANY} ("we," "us," or "our") operates the DripMap mobile application and website (collectively, the "Service"). This Privacy Policy explains how we collect, use, and protect your information when you use our Service. By using DripMap, you agree to the practices described in this policy.
          </p>
        </section>

        <Section title="1. Information We Collect">
          <p>We collect information you provide directly, automatically through your use of the Service, and optionally from your device.</p>
          <SubSection title="a. Information You Provide">
            <ul>
              <li><strong>Account information:</strong> Email address, username, and password when you create an account.</li>
              <li><strong>Profile information:</strong> Avatar photo, bio, and social links (Instagram, X) if you choose to add them.</li>
              <li><strong>Content you post:</strong> Photos, drink names, notes, reviews ("POURNs"), and experience logs you submit.</li>
              <li><strong>Shop data:</strong> If you add or claim a coffee shop, we collect the shop name, address, photos, and other details you provide.</li>
              <li><strong>Coffee Date invitations:</strong> If you use the Coffee Date feature and grant contacts permission, we access your device contacts only to help you invite friends. We do not store your contacts on our servers.</li>
              <li><strong>Payment information:</strong> Subscription purchases are processed by Apple's App Store. We do not receive or store your payment card details. We receive confirmation of purchase status from Apple and RevenueCat.</li>
            </ul>
          </SubSection>
          <SubSection title="b. Information Collected Automatically">
            <ul>
              <li><strong>Location data:</strong> If you grant permission, we use your device location to show coffee shops near you and on the map. Location is not stored on our servers unless you explicitly choose to tag a post with a location.</li>
              <li><strong>Device push token:</strong> With your permission, we collect your device's push notification token to send you notifications about comments, follows, and DripMap updates.</li>
              <li><strong>Usage data:</strong> We may collect information about how you interact with the app (screens visited, features used) to improve the Service.</li>
            </ul>
          </SubSection>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul>
            <li>To create and manage your account</li>
            <li>To display your profile, POURNs, reviews, and public activity to other users</li>
            <li>To show coffee shops near you on the map</li>
            <li>To send push notifications you have opted into</li>
            <li>To process and verify subscription status (DripClub)</li>
            <li>To calculate your Drip Score and leaderboard ranking</li>
            <li>To communicate with you about your account or the Service</li>
            <li>To improve and develop new features</li>
            <li>To enforce our Terms of Service and prevent abuse</li>
          </ul>
        </Section>

        <Section title="3. How We Share Your Information">
          <p>We do not sell your personal information. We share information only in these limited circumstances:</p>
          <ul>
            <li><strong>Publicly:</strong> Your username, profile photo, POURNs, reviews, and experience logs are visible to all users of the Service (logged in or not).</li>
            <li><strong>Service providers:</strong> We use Supabase (database and authentication), Mapbox (mapping), RevenueCat (subscription management), and Expo (app delivery). These providers process data on our behalf under appropriate data security standards.</li>
            <li><strong>Legal requirements:</strong> We may disclose information if required by law, subpoena, or to protect the rights, safety, or property of DripMap, our users, or the public.</li>
            <li><strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
          </ul>
        </Section>

        <Section title="4. Data Storage &amp; Security">
          <p>
            Your data is stored on Supabase's secure cloud infrastructure. We use industry-standard security measures including TLS encryption in transit, row-level security policies in our database, and access controls to protect your data. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </Section>

        <Section title="5. Your Rights &amp; Choices">
          <ul>
            <li><strong>Access &amp; update:</strong> You can view and update your profile information at any time from the app.</li>
            <li><strong>Delete your account:</strong> You can request deletion of your account and associated data by going to your Profile → Settings → Delete Account, or by emailing us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-volt-600 font-semibold underline">{CONTACT_EMAIL}</a>. We will delete your account and personal data within 30 days.</li>
            <li><strong>Push notifications:</strong> You can disable push notifications at any time in your device's iOS settings.</li>
            <li><strong>Location:</strong> You can revoke location permission at any time in your device's iOS settings. The app will continue to function without location access.</li>
            <li><strong>Camera &amp; contacts:</strong> Camera and contacts permissions can be revoked at any time in iOS settings.</li>
          </ul>
        </Section>

        <Section title="6. Children's Privacy">
          <p>
            DripMap is not directed at children under the age of 17. We do not knowingly collect personal information from anyone under 17. If we become aware that a child under 17 has provided us with personal information, we will delete it promptly. If you believe a child has submitted information to us, please contact us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-volt-600 font-semibold underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="7. Third-Party Links &amp; Services">
          <p>
            Our app may contain links to third-party websites or services (such as coffee shop websites or social media profiles). We are not responsible for the privacy practices of those third parties. We encourage you to review their privacy policies.
          </p>
        </Section>

        <Section title="8. International Users">
          <p>
            DripMap is based in the United States. If you are accessing our Service from outside the US, please be aware that your data may be transferred to, stored, and processed in the United States. By using our Service, you consent to this transfer.
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the Effective Date at the top of this page, and where required by law, we will provide additional notice (such as an in-app notification). Your continued use of the Service after changes are posted constitutes your acceptance of the revised policy.
          </p>
        </Section>

        <Section title="10. Contact Us">
          <p>If you have any questions or concerns about this Privacy Policy, please contact us:</p>
          <div className="mt-4 p-5 bg-white rounded-2xl border border-coffee-100">
            <p className="font-bold text-coffee-900">DripMap</p>
            <p className="text-coffee-800">Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-volt-600 font-semibold underline">{CONTACT_EMAIL}</a></p>
            <p className="text-coffee-800">Website: <a href={APP_URL} className="text-volt-600 font-semibold underline">{APP_URL}</a></p>
          </div>
        </Section>

        {/* Footer links */}
        <div className="pt-8 border-t border-coffee-100 flex flex-col sm:flex-row gap-4 items-center justify-between text-sm text-coffee-800">
          <span>© {new Date().getFullYear()} DripMap. All rights reserved.</span>
          <a href="#/terms" className="hover:text-coffee-900 font-semibold transition-colors">Terms of Service →</a>
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
