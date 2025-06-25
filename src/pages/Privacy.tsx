
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                When you use Gym Tuner, we collect information that you provide directly to us, such as:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Account information (email address, name)</li>
                <li>Workout data and fitness goals</li>
                <li>Injury tracking information</li>
                <li>Usage data and preferences</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
            <div className="space-y-4 text-gray-700">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and improve our fitness tracking services</li>
                <li>Generate personalized AI workout recommendations</li>
                <li>Track your progress and fitness goals</li>
                <li>Communicate with you about your account and our services</li>
                <li>Process payments and manage subscriptions</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Storage and Security</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Your data is stored securely using industry-standard encryption and security practices. 
                We use Supabase for data storage, which provides enterprise-grade security and compliance.
              </p>
              <p>
                We implement appropriate technical and organizational measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Sharing</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                We do not sell, trade, or otherwise transfer your personal information to third parties 
                without your consent, except as described in this policy:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>With service providers who assist us in operating our service</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transfer or acquisition</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <div className="space-y-4 text-gray-700">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Export your data</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                We use cookies and similar technologies to enhance your experience, analyze usage, 
                and provide personalized content. You can control cookie settings through your browser.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Our service is not intended for children under 13 years of age. We do not knowingly 
                collect personal information from children under 13.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                We may update this privacy policy from time to time. We will notify you of any 
                changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                If you have any questions about this privacy policy or our data practices, 
                please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">Gym Tuner Support</p>
                <p>Email: privacy@gymtuner.com</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
