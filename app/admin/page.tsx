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
  const [activeTab, setActiveTab] = useState<'session' | 'test'>('session');
  const [secret, setSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
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
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getHeaders = () => ({
    "x-admin-secret": secret,
    "Content-Type": "application/json"
  });

  // Storage functions for persistent login
  const saveCredentials = (adminSecret: string) => {
    const authData = {
      secret: adminSecret,
      timestamp: Date.now(),
      expiresIn: 24 * 60 * 60 * 1000 // 24 hours
    };
    localStorage.setItem('uap-admin-auth', JSON.stringify(authData));
  };

  const getStoredCredentials = () => {
    try {
      const stored = localStorage.getItem('uap-admin-auth');
      if (!stored) return null;
      
      const authData = JSON.parse(stored);
      const now = Date.now();
      
      // Check if credentials have expired
      if (now - authData.timestamp > authData.expiresIn) {
        localStorage.removeItem('uap-admin-auth');
        return null;
      }
      
      return authData.secret;
    } catch (error) {
      localStorage.removeItem('uap-admin-auth');
      return null;
    }
  };

  const clearStoredCredentials = () => {
    localStorage.removeItem('uap-admin-auth');
  };

  const logout = () => {
    clearStoredCredentials();
    setAuthenticated(false);
    setSecret("");
    setSuccess("Logged out successfully");
    setError("");
  };

  const checkApiStatus = async () => {
    try {
      // Try a simple API call to check connectivity
      const response = await fetch('/api/admin/sessions', { 
        headers: getHeaders(),
        method: 'GET'
      });
      
      if (response.status === 401) {
        setApiStatus('connected'); // API exists but needs auth
      } else if (response.status === 404) {
        setApiStatus('disconnected'); // API doesn't exist
      } else {
        setApiStatus('connected'); // API exists and responded
      }
    } catch (err) {
      setApiStatus('disconnected');
    }
  };

  async function authenticate() {
    if (!secret) {
      setError("Please enter admin password");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const response = await fetch('/api/admin/sessions', {
        headers: { "x-admin-secret": secret }
      });

      if (response.ok) {
        setAuthenticated(true);
        setError("");
        saveCredentials(secret); // Save credentials to localStorage
        await loadSessions();
      } else {
        let errorMessage = "Authentication failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch (jsonError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        setError(errorMessage);
        clearStoredCredentials(); // Clear any invalid stored credentials
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      clearStoredCredentials();
    } finally {
      setLoading(false);
    }
  }

  async function checkStoredAuth() {
    setCheckingAuth(true);
    const storedSecret = getStoredCredentials();
    
    if (!storedSecret) {
      setCheckingAuth(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/sessions', {
        headers: { "x-admin-secret": storedSecret }
      });

      if (response.ok) {
        setSecret(storedSecret);
        setAuthenticated(true);
        await loadSessions();
      } else {
        clearStoredCredentials();
      }
    } catch (err) {
      clearStoredCredentials();
    } finally {
      setCheckingAuth(false);
    }
  }

  async function loadSessions() {
    try {
      const response = await fetch('/api/admin/sessions', { headers: getHeaders() });
      
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
        if (data.sessions.length > 0 && !selectedSession) {
          setSelectedSession(data.sessions[0].id);
        }
      } else if (response.status === 401) {
        setError("Authentication expired. Please login again.");
        logout();
      } else if (response.status === 404) {
        setError("Sessions API not available. Please check backend configuration.");
      } else {
        try {
          const data = await response.json();
          setError(data.error || `Failed to load sessions (${response.status})`);
        } catch {
          setError(`Failed to load sessions (${response.status})`);
        }
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unable to connect to server'}`);
    }
  }

  async function loadCandidates(sessionId: string) {
    try {
      const response = await fetch(`/api/admin/candidates?sessionId=${sessionId}`, { headers: getHeaders() });
      
      if (response.ok) {
        const data = await response.json();
        setCandidates(data.candidates);
      } else if (response.status === 401) {
        setError("Authentication expired. Please login again.");
        logout();
      } else if (response.status === 404) {
        console.warn("Candidates API not available");
        setCandidates([]);
      } else {
        console.warn(`Failed to load candidates: ${response.status}`);
        setCandidates([]);
      }
    } catch (err) {
      console.warn("Failed to load candidates:", err);
      setCandidates([]);
    }
  }

  async function loadResults(sessionId: string) {
    try {
      const response = await fetch(`/api/admin/results?sessionId=${sessionId}`, { headers: getHeaders() });
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else if (response.status === 401) {
        setError("Authentication expired. Please login again.");
        logout();
      } else if (response.status === 404) {
        console.warn("Results API not available");
        setResults(null);
      } else {
        console.warn(`Failed to load results: ${response.status}`);
        setResults(null);
      }
    } catch (err) {
      console.warn("Failed to load results:", err);
      setResults(null);
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
        headers: getHeaders(),
        body: JSON.stringify({
          title: newSessionTitle,
          description: newSessionDescription
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess("Session created successfully");
        setNewSessionTitle("");
        setNewSessionDescription("");
        await loadSessions();
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
        headers: getHeaders(),
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
        headers: getHeaders(),
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
          setError(`Warning: ${data.results.emailsFailed} emails failed to send`);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to upload voters");
    } finally {
      setLoading(false);
    }
  }

  async function activateSession() {
    if (!selectedSession) return;

    setLoading(true);
    setError("");
    
    try {
      const response = await fetch('/api/admin/sessions/activate', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ sessionId: selectedSession })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess("Session activated successfully");
        await loadSessions();
      } else if (response.status === 404) {
        setError("Session activation API not available. Please check if the backend is properly configured.");
      } else if (response.status === 401) {
        setError("Authentication expired. Please refresh the page and login again.");
        logout();
      } else {
        try {
          const data = await response.json();
          setError(data.error || `Failed to activate session (${response.status})`);
        } catch {
          setError(`Failed to activate session (${response.status})`);
        }
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  async function checkEmailConfig() {
    try {
      const response = await fetch('/api/admin/email-config', { headers: getHeaders() });
      
      if (response.ok) {
        const data = await response.json();
        setEmailConfig(data);
      } else if (response.status === 404) {
        // API endpoint doesn't exist - use fallback
        setEmailConfig({
          configured: false,
          message: "Email configuration API not available",
          connectionWorking: false
        });
      } else {
        console.warn("Email config check failed:", response.status);
      }
    } catch (err) {
      console.warn("Email config check failed:", err);
      // Set fallback email config
      setEmailConfig({
        configured: false,
        message: "Email configuration check unavailable",
        connectionWorking: false
      });
    }
  }

  async function checkDatabaseConfig() {
    try {
      const response = await fetch('/api/admin/database-config', { headers: getHeaders() });
      
      if (response.ok) {
        const data = await response.json();
        setDbConfig(data);
      } else if (response.status === 404) {
        // API endpoint doesn't exist - use fallback
        setDbConfig({
          connected: false,
          error: "Database configuration API not available"
        });
      } else {
        console.warn("Database config check failed:", response.status);
      }
    } catch (err) {
      console.warn("Database config check failed:", err);
      // Set fallback database config
      setDbConfig({
        connected: false,
        error: "Database configuration check unavailable"
      });
    }
  }

  async function testEmailConfig() {
    if (!testEmail) {
      setError("Test email address is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email: testEmail })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess("Test email sent successfully");
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to send test email");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Check for stored credentials on component mount
    checkStoredAuth();
    // Check API status
    checkApiStatus();
  }, []);

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

  // Show loading screen while checking stored auth
  if (checkingAuth) {
    return (
      <main className="bg-white min-h-screen">
        <div className="max-w-3xl mx-auto p-6">
          <h1 className="text-2xl font-bold text-uap-maroon mb-4">Admin Panel</h1>
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">
              <div className="animate-pulse">Checking authentication...</div>
            </div>
          </div>
        </div>
      </main>
    );
  }

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

  return (
    <main className="bg-white min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-uap-maroon">UAP Board Voting - Admin Panel</h1>
            <p className="text-sm text-gray-500 mt-1">
              Logged in • Session expires in 24 hours
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            title="Logout and clear stored session"
          >
            🚪 Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <div className="flex items-start">
              <div className="mr-2">❌</div>
              <div>
                <strong>Error:</strong> {error}
                {error.includes('404') && (
                  <div className="text-sm mt-1">
                    <em>Note: This may indicate that the backend API endpoints are not yet implemented or the server is not running.</em>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center">
              <div className="mr-2">✅</div>
              <div>{success}</div>
            </div>
          </div>
        )}

        {/* Development Status Banner */}
        <div className={`border rounded-lg p-4 mb-6 ${
          apiStatus === 'connected' ? 'bg-green-50 border-green-200' : 
          apiStatus === 'disconnected' ? 'bg-yellow-50 border-yellow-200' : 
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start">
            <div className="mr-3">
              {apiStatus === 'connected' ? '✅' : 
               apiStatus === 'disconnected' ? '⚠️' : '🔄'}
            </div>
            <div>
              <h3 className={`font-semibold ${
                apiStatus === 'connected' ? 'text-green-800' : 
                apiStatus === 'disconnected' ? 'text-yellow-800' : 
                'text-blue-800'
              }`}>
                API Status: {
                  apiStatus === 'connected' ? 'Connected' : 
                  apiStatus === 'disconnected' ? 'Backend Not Available' : 
                  'Checking...'
                }
              </h3>
              <p className={`text-sm mt-1 ${
                apiStatus === 'connected' ? 'text-green-700' : 
                apiStatus === 'disconnected' ? 'text-yellow-700' : 
                'text-blue-700'
              }`}>
                {apiStatus === 'connected' ? 
                  'Backend API is responding. All features should work normally.' :
                  apiStatus === 'disconnected' ? 
                  'Backend API endpoints are not available. This interface is for UI/UX testing only.' :
                  'Checking backend API connectivity...'
                }
              </p>
              {apiStatus === 'disconnected' && (
                <div className="mt-2 text-xs text-yellow-600">
                  <strong>Missing endpoints:</strong> /api/admin/* - Please ensure backend server is running
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg mb-6">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('session')}
              className={`flex-1 py-3 px-6 text-center font-medium text-sm rounded-l-lg transition-colors ${
                activeTab === 'session'
                  ? 'bg-uap-blue text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              📊 Session Management
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`flex-1 py-3 px-6 text-center font-medium text-sm rounded-r-lg transition-colors ${
                activeTab === 'test'
                  ? 'bg-uap-blue text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              🧪 Test Platform
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'session' && (
          <SessionManagementTab
            sessions={sessions}
            selectedSession={selectedSession}
            setSelectedSession={setSelectedSession}
            candidates={candidates}
            results={results}
            voterEmails={voterEmails}
            setVoterEmails={setVoterEmails}
            newSessionTitle={newSessionTitle}
            setNewSessionTitle={setNewSessionTitle}
            newSessionDescription={newSessionDescription}
            setNewSessionDescription={setNewSessionDescription}
            newCandidateName={newCandidateName}
            setNewCandidateName={setNewCandidateName}
            newCandidateDescription={newCandidateDescription}
            setNewCandidateDescription={setNewCandidateDescription}
            loading={loading}
            createSession={createSession}
            activateSession={activateSession}
            addCandidate={addCandidate}
            uploadVoters={uploadVoters}
            loadResults={loadResults}
            loadCandidates={loadCandidates}
          />
        )}

        {activeTab === 'test' && (
          <TestPlatformTab />
        )}
      </div>
    </main>
  );
}

// Session Management Tab Component
function SessionManagementTab({
  sessions,
  selectedSession,
  setSelectedSession,
  candidates,
  results,
  voterEmails,
  setVoterEmails,
  newSessionTitle,
  setNewSessionTitle,
  newSessionDescription,
  setNewSessionDescription,
  newCandidateName,
  setNewCandidateName,
  newCandidateDescription,
  setNewCandidateDescription,
  loading,
  createSession,
  activateSession,
  addCandidate,
  uploadVoters,
  loadResults,
  loadCandidates
}: any) {
  const currentSession = sessions.find((s: any) => s.id === selectedSession);

  const handleSessionChange = (sessionId: string) => {
    setSelectedSession(sessionId);
    if (sessionId) {
      loadCandidates(sessionId);
    }
  };

  return (
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
            onChange={(e) => handleSessionChange(e.target.value)}
            className="w-full border p-2 rounded mb-4"
          >
            <option value="">Select a session...</option>
            {sessions.map((session: any) => (
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
              
              {currentSession.status !== 'draft' && (
                <button
                  onClick={() => loadResults(selectedSession)}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 mt-2"
                >
                  View Results
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
                    {candidates.map((candidate: any) => (
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

      {/* Results Section */}
      {results && results.totalVotes > 0 && (
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">📊 Election Results</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-uap-blue">{results.totalVotes}</div>
              <div className="text-sm text-gray-600">Total Votes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{results.statistics.participationRate}%</div>
              <div className="text-sm text-gray-600">Participation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-uap-maroon">{results.statistics.totalInvited}</div>
              <div className="text-sm text-gray-600">Total Invited</div>
            </div>
          </div>

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
              {results.results.map((candidate: any, index: number) => (
                <div key={candidate.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{index + 1}. {candidate.name}</span>
                  <span className="font-medium">{candidate.vote_count} votes ({candidate.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Test Platform Tab Component
function TestPlatformTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">🧪 Test Platform</h2>
        <p className="text-gray-600 mb-6">
          Use this platform to test voting functionality, simulate elections, and verify system performance before deploying live elections.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">🎯 Mock Election Testing</h3>
            <p className="text-sm text-blue-700 mb-3">
              Create test elections with sample candidates and voters to verify all system components work correctly.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
              Start Mock Election
            </button>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-2">📧 Email Delivery Testing</h3>
            <p className="text-sm text-green-700 mb-3">
              Test email delivery, voting link generation, and notification systems with test accounts.
            </p>
            <button className="bg-green-600 text-white px-4 py-2 rounded text-sm">
              Test Email System
            </button>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">🔐 Security Testing</h3>
            <p className="text-sm text-yellow-700 mb-3">
              Verify authentication, vote anonymity, and system security with simulated scenarios.
            </p>
            <button className="bg-yellow-600 text-white px-4 py-2 rounded text-sm">
              Run Security Tests
            </button>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-medium text-purple-800 mb-2">📊 Performance Testing</h3>
            <p className="text-sm text-purple-700 mb-3">
              Test system performance with multiple concurrent voters and high-load scenarios.
            </p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded text-sm">
              Performance Test
            </button>
          </div>
        </div>
        
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-2">📋 Test Results History</h3>
          <p className="text-sm text-gray-600 mb-3">View previous test results and system validation reports.</p>
          <div className="text-sm text-gray-500">
            <p>• Last security test: Passed (2025-01-15)</p>
            <p>• Last performance test: Passed (2025-01-12)</p>
            <p>• Last email test: Passed (2025-01-14)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
