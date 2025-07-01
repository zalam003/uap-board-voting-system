export default function GovernancePage() {
  return (
    <main className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 pt-0 pb-4">
        <div className="text-center mb-0 -mt-4" style={{marginTop: '-1.5rem'}}>
          <p className="text-lg text-gray-700 mb-0" style={{margin: '0', lineHeight: '1.2', paddingTop: '0.5rem'}}>
            Electronic Voting System Governance and Implementation Framework
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6 mt-6">
          <h2 className="text-xl font-semibold text-amber-800 mb-4">📋 Digital Governance Initiative</h2>
          <p className="text-gray-700 mb-4">
            The University of Asia Pacific Foundation is establishing a comprehensive electronic voting system 
            to enable all Board of Directors members to participate fully in governance activities, regardless 
            of their geographic location or scheduling constraints.
          </p>
          <p className="text-gray-700 mb-4">
            This digital transformation initiative ensures that every board member can exercise their voting 
            rights in a secure, transparent, and accessible manner, strengthening our democratic governance 
            processes while maintaining the highest standards of election integrity.
          </p>
          <p className="text-gray-700">
            The system is designed in full compliance with the Companies Act, 1994, and incorporates 
            best practices for digital democracy, cybersecurity, and audit transparency.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">🔒 Security & Transparency</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-medium mb-2">Voter Security:</h4>
              <ul className="space-y-1">
                <li>JWT-based authentication</li>
                <li>Anonymous vote storage</li>
                <li>IP and device tracking</li>
                <li>Vote verification codes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Election Integrity:</h4>
              <ul className="space-y-1">
                <li>Complete audit trails</li>
                <li>Real-time monitoring</li>
                <li>Duplicate vote prevention</li>
                <li>Transparent result reporting</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📋 How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="bg-uap-blue text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1'}}>⚙️</div>
              <h4 className="font-medium mb-1">Admin Setup</h4>
              <p className="text-gray-600">Create election and add candidates</p>
            </div>
            <div className="text-center">
              <div className="bg-uap-blue text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1'}}>📧</div>
              <h4 className="font-medium mb-1">Send Invitations</h4>
              <p className="text-gray-600">Upload voter list and send secure links</p>
            </div>
            <div className="text-center">
              <div className="bg-uap-blue text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1'}}>🗳️</div>
              <h4 className="font-medium mb-1">Cast Votes</h4>
              <p className="text-gray-600">Voters use email links within time limit</p>
            </div>
            <div className="text-center">
              <div className="bg-uap-blue text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1'}}>📊</div>
              <h4 className="font-medium mb-1">View Results</h4>
              <p className="text-gray-600">Real-time tallies and final reports</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-green-800 mb-3">⚖️ Legal Compliance Framework</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
            <div>
              <h4 className="font-medium mb-2">Regulatory Compliance:</h4>
              <ul className="space-y-1">
                <li>Companies Act, 1994 Section 28 compliance</li>
                <li>Article 22 voting rights protection</li>
                <li>Personal voting requirement adherence</li>
                <li>RJSC filing compliance</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Governance Oversight:</h4>
              <ul className="space-y-1">
                <li>Board of Governors authority</li>
                <li>Election Management Committee</li>
                <li>Independent security audits</li>
                <li>Legal counsel review</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2025 University of Asia Pacific - Digital Governance Framework</p>
          <p>For governance inquiries, contact the Board Secretary.</p>
        </div>
      </div>
    </main>
  );
}