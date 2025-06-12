"use client";

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="mb-4">
            This Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you use our social media management
            application. Please read this privacy policy carefully. If you do
            not agree with the terms of this privacy policy, please do not
            access the application.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            2. Information We Collect
          </h2>
          <div className="ml-4">
            <h3 className="text-xl font-semibold mb-2">
              2.1 Personal Information
            </h3>
            <p className="mb-4">
              We may collect personal information that you voluntarily provide
              to us when you:
            </p>
            <ul className="list-disc ml-8 mb-4">
              <li>Register for an account</li>
              <li>Connect your social media accounts</li>
              <li>Create or schedule social media posts</li>
              <li>Contact us for support</li>
            </ul>
            <p className="mb-4">This information may include:</p>
            <ul className="list-disc ml-8 mb-4">
              <li>Name and email address</li>
              <li>Social media account information</li>
              <li>Content you create and schedule through our platform</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">2.2 Facebook Data</h3>
            <p className="mb-4">
              When you connect your Facebook account, we may access:
            </p>
            <ul className="list-disc ml-8 mb-4">
              <li>Basic profile information</li>
              <li>Pages you manage</li>
              <li>Publishing permissions for your pages</li>
              <li>Post engagement metrics</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            3. How We Use Your Information
          </h2>
          <p className="mb-4">
            We use the collected information for various purposes:
          </p>
          <ul className="list-disc ml-8 mb-4">
            <li>To provide and maintain our service</li>
            <li>
              To schedule and publish content to your social media accounts
            </li>
            <li>To communicate with you about service updates</li>
            <li>To provide customer support</li>
            <li>To detect and prevent fraud or abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            4. Data Storage and Security
          </h2>
          <p className="mb-4">
            We implement appropriate technical and organizational security
            measures to protect your information. Your data is stored securely
            on Supabase infrastructure with encryption at rest and in transit.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Your Data Rights</h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc ml-8 mb-4">
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Disconnect social media accounts</li>
            <li>Export your data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            6. Third-Party Services
          </h2>
          <p className="mb-4">
            Our service integrates with social media platforms like Facebook.
            When you connect these services, their privacy policies may also
            apply. We encourage you to review their privacy policies:
          </p>
          <ul className="list-disc ml-8 mb-4">
            <li>
              <a
                href="https://www.facebook.com/privacy/policy"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook Data Policy
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            7. Changes to Privacy Policy
          </h2>
          <p className="mb-4">
            We may update this privacy policy from time to time. We will notify
            you of any changes by posting the new privacy policy on this page
            and updating the &quot;Last Updated&quot; date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact
            us at:
          </p>
          <ul className="list-disc ml-8 mb-4">
            {" "}
            <li>Email: support@smmapp.com</li>
            <li>Address: Riyadh, Saudi Arabia</li>
          </ul>
        </section>

        <footer className="mt-8 pt-4 border-t text-gray-600">
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
        </footer>
      </div>
    </div>
  );
}
