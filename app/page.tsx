export default function HomePage() {
  return (
    <main className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 pt-0 pb-4">
        <div className="text-center mb-0 -mt-4" style={{marginTop: '-1.5rem'}}>
          <p className="text-lg text-gray-700 mb-0" style={{margin: '0', lineHeight: '1.2', paddingTop: '0.5rem'}}>
            Welcome to the secure digital voting portal for the University of Asia Pacific Board of Directors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-uap-blue mb-3">🗳️ Cast Your Vote</h2>
            <p className="text-gray-600 mb-4">
              Board members with voting invitations can access the secure voting portal using the link provided in their email.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✅ Email-based authentication</p>
              <p>✅ One-hour voting window</p>
              <p>✅ Anonymous and secure</p>
              <p>✅ Instant vote confirmation</p>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              <strong>Note:</strong> Voting links are sent directly to authorized board members' email addresses.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-uap-blue mb-3">👥 Admin Panel</h2>
            <p className="text-gray-600 mb-4">
              Election administrators can manage voting sessions, candidates, and view real-time results.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>⚙️ Create voting sessions</p>
              <p>👤 Manage candidates</p>
              <p>📧 Send voter invitations</p>
              <p>📊 View live results</p>
            </div>
            <a 
              href="/admin" 
              className="inline-block bg-white text-uap-blue border-2 border-uap-blue px-6 py-2 rounded-lg font-medium hover:bg-uap-blue hover:text-white transition-colors mt-4"
            >
              Access Admin Panel
            </a>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2025 University of Asia Pacific - Secure Digital Voting System</p>
          <p>For technical support, contact the election administrator.</p>
        </div>
      </div>
    </main>
  );
}
