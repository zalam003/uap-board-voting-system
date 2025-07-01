"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface VotingSession {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'closed';
  start_time: string;
  end_time: string;
  candidate_count: number;
  voter_count: number;
  vote_count: number;
}

interface Candidate {
  id: string;
  name: string;
  description: string;
  position: number;
}

interface VoteResult {
  id: string;
  name: string;
  vote_count: number;
  percentage: string;
}

interface ElectionResults {
  session: any;
  statistics: any;
  results: VoteResult[];
  winner: any;
  totalVotes: number;
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [sessions, setSessions] = useState<VotingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [voterEmails, setVoterEmails] = useState("");
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [newSessionDescription, setNewSessionDescription] = useState("");
  const [newCandidateName, setNewCandidateName] = useState("");
  const [newCandidateDescription, setNewCandidateDescription] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [emailConfig, setEmailConfig] = useState<any>(null);
  const [dbConfig, setDbConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const headers = {
    "x-admin-secret": secret,
    "Content-Type": "application/json"
  };

  async function authenticate() {
    if (!secret) {
      setError("Please enter admin password");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/sessions', {
        headers: { "x-admin-secret": secret }
      });

      if (response.ok) {
        setAuthenticated(true);
        setError("");
        await loadSessions();
      } else {
        const errorData = await response.json();
        setError(`Authentication failed: ${errorData.error || 'Invalid admin password'}`);
      }
    } catch (err) {
      setError("Failed to authenticate - network error");
    } finally {
      setLoading(false);
    }
  }

  async function loadSessions() {
    try {
      const response = await fetch('/api/admin/sessions', { headers });
      const data = await response.json();
      
      if (response.ok) {
        setSessions(data.sessions);
        if (data.sessions.length > 0 && !selectedSession) {
          setSelectedSession(data.sessions[0].id);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to load sessions");
    }
  }

  async function loadCandidates(sessionId: string) {
    try {
      const response = await fetch(`/api/admin/candidates?sessionId=${sessionId}`, { headers });
      const data = await response.json();
      
      if (response.ok) {
        setCandidates(data.candidates);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to load candidates");
    }
  }

  async function loadResults(sessionId: string) {
    try {
      const response = await fetch(`/api/admin/results?sessionId=${sessionId}`, { headers });
      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to load results");
    }
  }

  async function createSession() {
    if (!newSessionTitle.trim()) {
      setError("Session title is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newSessionTitle,
          description: newSessionDescription,
          durationHours: 1
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess("Session created successfully");
        setNewSessionTitle("");
        setNewSessionDescription("");
        await loadSessions();
        setSelectedSession(data.session.id);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to create session");
    } finally {
      setLoading(false);
    }
  }

  async function addCandidate() {
    if (!newCandidateName.trim() || !selectedSession) {
      setError("Candidate name and session selection are required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/candidates', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sessionId: selectedSession,
          name: newCandidateName,
          description: newCandidateDescription
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess("Candidate added successfully");
        setNewCandidateName("");
        setNewCandidateDescription("");
        await loadCandidates(selectedSession);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to add candidate");
    } finally {
      setLoading(false);
    }
  }

  async function uploadVoters() {
    if (!voterEmails.trim() || !selectedSession) {
      setError("Voter emails and session selection are required");
      return;
    }

    const emails = voterEmails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email);

    if (emails.length === 0) {
      setError("No valid emails found");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/voters', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sessionId: selectedSession,
          emails
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(`Voters processed: ${data.results.emailsSent} emails sent successfully`);
        setVoterEmails("");
        if (data.results.emailsFailed > 0) {
          setError(`${data.results.emailsFailed} emails failed. Check console for details.`);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to process voters");
    } finally {
      setLoading(false);
    }
  }

  async function activateSession() {
    if (!selectedSession) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/sessions', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          id: selectedSession,
          status: 'active'
        })
      });

      if (response.ok) {
        setSuccess("Voting session activated successfully");
        await loadSessions();
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to activate session");
    } finally {
      setLoading(false);
    }
  }

  function downloadResults() {
    if (!selectedSession) return;
    
    const url = `/api/admin/results?sessionId=${selectedSession}&format=csv`;
    window.open(url, '_blank');
  }

  async function checkEmailConfig() {
    try {
      const response = await fetch('/api/admin/test-email', { headers });
      const data = await response.json();
      
      if (response.ok) {
        setEmailConfig(data);
        setError("");
      } else {
        setError(data.error || "Failed to check email configuration");
      }
    } catch (err) {
      setError("Failed to check email configuration");
    }
  }

  async function sendTestEmail() {
    if (!testEmail.trim()) {
      setError("Please enter an email address for testing");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: testEmail })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(`Test email sent successfully to ${testEmail}`);
        setTestEmail("");
        setError("");
      } else {
        setError(data.error || "Failed to send test email");
      }
    } catch (err) {
      setError("Failed to send test email");
    } finally {
      setLoading(false);
    }
  }

  async function checkDatabaseConfig() {
    try {
      const response = await fetch('/api/admin/test-db', { headers });
      const data = await response.json();
      
      if (response.ok) {
        setDbConfig(data);
        setError("");
      } else {
        setDbConfig({ error: data.error, details: data.details, suggestions: data.suggestions });
        setError(data.error || "Failed to check database configuration");
      }
    } catch (err) {
      setError("Failed to check database configuration");
      setDbConfig({ error: "Connection failed", details: "Could not connect to database test endpoint" });
    }
  }

  async function initializeDatabase() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/test-db', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'initialize' })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess("Database initialized successfully");
        setError("");
        await checkDatabaseConfig(); // Refresh database status
      } else {
        setError(data.error || "Failed to initialize database");
      }
    } catch (err) {
      setError("Failed to initialize database");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authenticated) {
      loadSessions();
      checkEmailConfig();
      checkDatabaseConfig();
    }
  }, [authenticated]);

  useEffect(() => {
    if (selectedSession && authenticated) {
      loadCandidates(selectedSession);
      loadResults(selectedSession);
    }
  }, [selectedSession, authenticated]);

  if (!authenticated) {
    return (
      <main className="bg-white min-h-screen">
        <div className="max-w-3xl mx-auto p-6">
          <h1 className="text-2xl font-bold text-uap-maroon mb-4">Admin Panel</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Enter Admin Password:</label>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="border p-2 mb-4 block w-full max-w-sm"
                onKeyPress={(e) => e.key === 'Enter' && authenticate()}
              />
            </div>
            <button 
              onClick={authenticate}
              disabled={loading}
              className="px-6 py-2 rounded disabled:opacity-50"
              style={{
                backgroundColor: '#7a0026',
                color: 'white',
                border: 'none'
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#4b0019';
              }}
              onMouseLeave={(e) => {
                if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#7a0026';
              }}
            >
              {loading ? "Authenticating..." : "Access Admin Panel"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const currentSession = sessions.find(s => s.id === selectedSession);

  return (
    <main className="bg-white min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-uap-maroon mb-6">UAP Board Voting - Admin Panel</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session Management */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Create New Session</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Session Title</label>
                  <input
                    type="text"
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                    className="w-full border p-2 rounded"
                    placeholder="UAP Board Chairperson Election 2025"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newSessionDescription}
                    onChange={(e) => setNewSessionDescription(e.target.value)}
                    className="w-full border p-2 rounded h-20"
                    placeholder="Annual election for Board Chairperson..."
                  />
                </div>
                <button
                  onClick={createSession}
                  disabled={loading}
                  className="px-4 py-2 rounded disabled:opacity-50"
                  style={{
                    backgroundColor: '#7a0026',
                    color: 'white',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#4b0019';
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#7a0026';
                  }}
                >
                  Create Session
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Select Session</h2>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full border p-2 rounded mb-4"
              >
                <option value="">Select a session...</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.title} ({session.status})
                  </option>
                ))}
              </select>

              {currentSession && (
                <div className="space-y-2 text-sm">
                  <p><strong>Status:</strong> {currentSession.status}</p>
                  <p><strong>Candidates:</strong> {currentSession.candidate_count}</p>
                  <p><strong>Voters:</strong> {currentSession.voter_count}</p>
                  <p><strong>Votes Cast:</strong> {currentSession.vote_count}</p>
                  
                  {currentSession.status === 'draft' && (
                    <button
                      onClick={activateSession}
                      disabled={loading || currentSession.candidate_count === 0}
                      className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 mt-2"
                    >
                      Activate Voting
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Candidate and Voter Management */}
          <div className="space-y-6">
            {selectedSession && (
              <>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Add Candidates</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Candidate Name</label>
                      <input
                        type="text"
                        value={newCandidateName}
                        onChange={(e) => setNewCandidateName(e.target.value)}
                        className="w-full border p-2 rounded"
                        placeholder="Dr. Ahmad Rahman"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={newCandidateDescription}
                        onChange={(e) => setNewCandidateDescription(e.target.value)}
                        className="w-full border p-2 rounded h-16"
                        placeholder="Brief candidate background..."
                      />
                    </div>
                    <button
                      onClick={addCandidate}
                      disabled={loading}
                      className="px-4 py-2 rounded disabled:opacity-50"
                      style={{
                        backgroundColor: '#7a0026',
                        color: 'white',
                        border: 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#4b0019';
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#7a0026';
                      }}
                    >
                      Add Candidate
                    </button>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Current Candidates:</h3>
                    {candidates.length === 0 ? (
                      <p className="text-gray-500">No candidates added yet</p>
                    ) : (
                      <ul className="space-y-1">
                        {candidates.map(candidate => (
                          <li key={candidate.id} className="text-sm">
                            {candidate.position}. {candidate.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Upload Voters</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email Addresses (one per line)
                      </label>
                      <textarea
                        value={voterEmails}
                        onChange={(e) => setVoterEmails(e.target.value)}
                        className="w-full border p-2 rounded h-32"
                        placeholder={`board.member1@uap-bd.edu
board.member2@uap-bd.edu
board.member3@uap-bd.edu`}
                      />
                    </div>
                    <button
                      onClick={uploadVoters}
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                      {loading ? "Sending Emails..." : "Upload Voters & Send Emails"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Email Configuration Section */}
        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">📧 Email Configuration</h2>
          
          {emailConfig && (
            <div className="mb-6">
              <div className={`p-4 rounded-lg ${emailConfig.configured ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h3 className={`font-medium ${emailConfig.configured ? 'text-green-800' : 'text-red-800'}`}>
                  {emailConfig.configured ? '✅ Gmail SMTP Configured' : '❌ Gmail SMTP Not Configured'}
                </h3>
                
                {emailConfig.configured ? (
                  <div className="mt-2 space-y-1 text-sm">
                    <p className={emailConfig.connectionWorking ? 'text-green-700' : 'text-orange-700'}>
                      <strong>Connection:</strong> {emailConfig.connectionWorking ? '✅ Working' : '⚠️ Failed'}
                    </p>
                    <p className="text-gray-700">
                      <strong>Gmail User:</strong> {emailConfig.gmailUser}
                    </p>
                    <p className="text-gray-700">
                      <strong>From Email:</strong> {emailConfig.fromEmail}
                    </p>
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="text-red-700 text-sm mb-2">{emailConfig.message}</p>
                    <div className="text-sm text-red-600 space-y-1">
                      <p><strong>Setup Instructions:</strong></p>
                      <ol className="list-decimal list-inside space-y-1 ml-4">
                        <li>Set GMAIL_USER to your Gmail address</li>
                        <li>Enable 2-Factor Authentication on Gmail</li>
                        <li>Generate an App Password in Gmail</li>
                        <li>Set GMAIL_APP_PASSWORD to the app password</li>
                        <li>Set FROM_EMAIL (usually same as GMAIL_USER)</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Test Email Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Test Email Address</label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full border p-2 rounded"
                    placeholder="test@example.com"
                  />
                </div>
                <button
                  onClick={sendTestEmail}
                  disabled={loading || !emailConfig?.configured}
                  className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Test Email"}
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Configuration Status</h3>
              <div className="space-y-2 text-sm">
                {emailConfig?.status && (
                  <>
                    <p>Gmail User: {emailConfig.status.gmailUser}</p>
                    <p>App Password: {emailConfig.status.gmailAppPassword}</p>
                    <p>From Email: {emailConfig.status.fromEmail}</p>
                  </>
                )}
                <button
                  onClick={checkEmailConfig}
                  className="bg-gray-600 text-white px-3 py-1 rounded text-sm"
                >
                  Refresh Status
                </button>
              </div>
            </div>
          </div>

          {!emailConfig?.configured && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Email Setup Required</h4>
              <p className="text-yellow-700 text-sm">
                Email functionality is required for sending voting invitations. Please configure Gmail SMTP settings in your environment variables.
              </p>
            </div>
          )}
        </div>

        {/* Database Configuration Section */}
        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">🐘 Database Configuration</h2>
          
          {dbConfig && (
            <div className="mb-6">
              {dbConfig.error ? (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <h3 className="font-medium text-red-800 mb-2">❌ Database Connection Failed</h3>
                  <p className="text-red-700 text-sm mb-2">{dbConfig.error}</p>
                  {dbConfig.details && (
                    <p className="text-red-600 text-sm mb-3">{dbConfig.details}</p>
                  )}
                  {dbConfig.suggestions && (
                    <div className="text-sm text-red-600">
                      <p className="font-medium mb-1">Suggestions:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        {dbConfig.suggestions.map((suggestion: string, index: number) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <h3 className="font-medium text-green-800 mb-2">✅ Database Connected</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">Connection Details:</h4>
                      <div className="space-y-1 text-green-600">
                        <p><strong>Database:</strong> {dbConfig.connection?.database}</p>
                        <p><strong>User:</strong> {dbConfig.connection?.user}</p>
                        <p><strong>Host:</strong> {dbConfig.connection?.host}</p>
                        <p><strong>Port:</strong> {dbConfig.connection?.port}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">Schema Status:</h4>
                      <div className="space-y-1 text-green-600">
                        <p><strong>Tables Found:</strong> {dbConfig.schema?.tablesFound}/{dbConfig.schema?.tablesExpected}</p>
                        <p><strong>Schema Complete:</strong> {dbConfig.schema?.isComplete ? '✅ Yes' : '❌ No'}</p>
                        {dbConfig.schema?.missingTables?.length > 0 && (
                          <p><strong>Missing:</strong> {dbConfig.schema.missingTables.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {dbConfig.data && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <h4 className="font-medium text-green-700 mb-2">Data Summary:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                        {Object.entries(dbConfig.data).map(([table, count]) => (
                          <div key={table} className="text-green-600">
                            <span className="font-medium">{table}:</span> {String(count)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Database Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={checkDatabaseConfig}
                  className="bg-blue-600 text-white px-4 py-2 rounded w-full"
                >
                  Test Database Connection
                </button>
                
                {dbConfig?.schema && !dbConfig.schema.isComplete && (
                  <button
                    onClick={initializeDatabase}
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 w-full"
                  >
                    {loading ? "Initializing..." : "Initialize Database"}
                  </button>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Database Information</h3>
              <div className="space-y-2 text-sm">
                {dbConfig?.connection && (
                  <>
                    <p><strong>PostgreSQL Version:</strong></p>
                    <p className="text-gray-600 text-xs">{dbConfig.connection.version?.substring(0, 50)}...</p>
                    <p><strong>Last Tested:</strong> {dbConfig.timestamp && new Date(dbConfig.timestamp).toLocaleString()}</p>
                  </>
                )}
                
                {!dbConfig && (
                  <p className="text-gray-500">Click "Test Database Connection" to check status</p>
                )}
              </div>
            </div>
          </div>

          {dbConfig?.error && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">🔧 Database Setup Required</h4>
              <p className="text-yellow-700 text-sm mb-2">
                PostgreSQL database connection is required for the voting system.
              </p>
              <div className="text-sm text-yellow-600">
                <p className="font-medium">Setup Steps:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2 mt-1">
                  <li>Install PostgreSQL server</li>
                  <li>Create database and user</li>
                  <li>Set DATABASE_URL in environment variables</li>
                  <li>Click "Initialize Database" to set up schema</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {results && selectedSession && (
          <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Election Results</h2>
              <button
                onClick={downloadResults}
                className="bg-gray-600 text-white px-4 py-2 rounded"
              >
                Download CSV Report
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-uap-maroon">{results.statistics.votesCast}</div>
                <div className="text-sm text-gray-600">Votes Cast</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-uap-maroon">{results.statistics.turnoutPercentage}%</div>
                <div className="text-sm text-gray-600">Turnout</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-uap-maroon">{results.statistics.totalInvited}</div>
                <div className="text-sm text-gray-600">Total Invited</div>
              </div>
            </div>

            {results.totalVotes > 0 && (
              <>
                <div className="mb-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={results.results}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="vote_count" fill="#7a0026" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {results.winner && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-bold text-green-800 mb-2">🏆 Election Winner</h3>
                    <p className="text-green-700">
                      <strong>{results.winner.name}</strong> wins with {results.winner.votes} votes 
                      ({results.winner.percentage}%) - Margin: {results.winner.margin} votes
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <h3 className="font-medium mb-2">Detailed Results:</h3>
                  <div className="space-y-2">
                    {results.results.map((candidate, index) => (
                      <div key={candidate.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{index + 1}. {candidate.name}</span>
                        <span className="font-medium">{candidate.vote_count} votes ({candidate.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}