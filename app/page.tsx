export default function HomePage() {
  return (
    <main className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-uap-maroon mb-4">UAP Board Voting System</h1>
          <p className="text-lg text-gray-700 mb-6">
            Welcome to the secure digital voting portal for the University of Asia Pacific Board of Directors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-uap-maroon mb-3">🗳️ Cast Your Vote</h2>
            <p className="text-gray-600 mb-4">
              Board members with voting invitations can access the secure voting portal using the link provided in their email.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• ✅ Email-based authentication</p>
              <p>• ✅ One-hour voting window</p>
              <p>• ✅ Anonymous and secure</p>
              <p>• ✅ Instant vote confirmation</p>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              <strong>Note:</strong> Voting links are sent directly to authorized board members' email addresses.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-uap-maroon mb-3">👥 Admin Panel</h2>
            <p className="text-gray-600 mb-4">
              Election administrators can manage voting sessions, candidates, and view real-time results.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• ⚙️ Create voting sessions</p>
              <p>• 👤 Manage candidates</p>
              <p>• 📧 Send voter invitations</p>
              <p>• 📊 View live results</p>
            </div>
            <a 
              href="/admin" 
              className="inline-block bg-uap-maroon text-white px-6 py-2 rounded-lg font-medium hover:bg-uap-dark transition-colors mt-4"
            >
              Access Admin Panel
            </a>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">🔒 Security & Transparency</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-medium mb-2">Voter Security:</h4>
              <ul className="space-y-1">
                <li>• JWT-based authentication</li>
                <li>• Anonymous vote storage</li>
                <li>• IP and device tracking</li>
                <li>• Vote verification codes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Election Integrity:</h4>
              <ul className="space-y-1">
                <li>• Complete audit trails</li>
                <li>• Real-time monitoring</li>
                <li>• Duplicate vote prevention</li>
                <li>• Transparent result reporting</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📋 How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="bg-uap-maroon text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">1</div>
              <h4 className="font-medium mb-1">Admin Setup</h4>
              <p className="text-gray-600">Create election and add candidates</p>
            </div>
            <div className="text-center">
              <div className="bg-uap-maroon text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">2</div>
              <h4 className="font-medium mb-1">Send Invitations</h4>
              <p className="text-gray-600">Upload voter list and send secure links</p>
            </div>
            <div className="text-center">
              <div className="bg-uap-maroon text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">3</div>
              <h4 className="font-medium mb-1">Cast Votes</h4>
              <p className="text-gray-600">Voters use email links within time limit</p>
            </div>
            <div className="text-center">
              <div className="bg-uap-maroon text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">4</div>
              <h4 className="font-medium mb-1">View Results</h4>
              <p className="text-gray-600">Real-time tallies and final reports</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2025 University of Asia Pacific - Secure Digital Voting System</p>
          <p>For technical support, contact the election administrator.</p>
        </div>
      </div>
    </main>
  );
}
