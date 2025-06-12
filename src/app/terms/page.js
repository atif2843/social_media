"use client";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
          <p className="mb-4">
            By accessing or using our social media management application, you agree to be bound by these Terms of Service and our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p className="mb-4">
            We provide a platform for managing and scheduling social media posts across various platforms, including Facebook and other supported services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
          <ul className="list-disc ml-8 mb-4">
            <li>You must provide accurate information when registering</li>
            <li>You are responsible for maintaining the security of your account</li>
            <li>You must comply with all applicable social media platform terms of service</li>
            <li>You must not use the service for any illegal or unauthorized purpose</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Account Terms</h2>
          <p className="mb-4">
            To access and use our services, you must register for an account. You are responsible for:
          </p>
          <ul className="list-disc ml-8 mb-4">
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property Rights</h2>
          <p className="mb-4">
            The service and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Content Guidelines</h2>
          <p className="mb-4">
            You retain ownership of any content you post through our service. However, you grant us permission to use this content to provide our services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Service Modifications</h2>
          <p className="mb-4">
            We reserve the right to modify or discontinue our service at any time, with or without notice.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
          <p className="mb-4">
            We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
          <p className="mb-4">
            We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
          <p className="mb-4">
            For any questions about these Terms, please contact us at:
          </p>
          <ul className="list-disc ml-8 mb-4">
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
