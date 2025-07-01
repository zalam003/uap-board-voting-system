"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';

interface Candidate {
  id: string;
  name: string;
  description: string;
  position: number;
}

interface VotingSession {
  id: string;
  title: string;
  description: string;
  endTime: string;
}

export default function VotePage() {
  const [votingData, setVotingData] = useState<{
    session: VotingSession;
    candidates: Candidate[];
  } | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<any>(null);
  
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError("No voting token provided. Please use the link from your email.");
      setLoading(false);
      return;
    }

    fetchVotingData();
  }, [token]);

  async function fetchVotingData() {
    try {
      const response = await fetch(`/api/vote?token=${encodeURIComponent(token!)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load voting information");
        return;
      }

      setVotingData(data);
    } catch (err) {
      setError("Failed to connect to voting system");
    } finally {
      setLoading(false);
    }
  }

  async function submitVote() {
    if (!selectedCandidate) {
      setError("Please select a candidate");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          candidateId: selectedCandidate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit vote");
        return;
      }

      setSuccess(data);
    } catch (err) {
      setError("Failed to submit vote. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="bg-white min-h-screen">
        <div className="max-w-3xl mx-auto p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-uap-maroon mb-4">Loading Voting Information...</h2>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="bg-white min-h-screen">
        <div className="max-w-3xl mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h3 className="font-bold">Unable to Load Voting Page</h3>
            <p>{error}</p>
          </div>
          <a href="/" className="text-uap-maroon underline">Return to Home</a>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="bg-white min-h-screen">
        <div className="max-w-3xl mx-auto p-6">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <h3 className="font-bold text-xl">✅ Vote Recorded Successfully!</h3>
            <p className="mt-2">{success.message}</p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h4 className="font-semibold mb-2">Vote Confirmation Details:</h4>
            <ul className="space-y-1 text-sm">
              <li><strong>Election:</strong> {success.session.title}</li>
              <li><strong>Vote Time:</strong> {new Date(success.timestamp).toLocaleString()}</li>
              <li><strong>Verification Code:</strong> 
                <span className="font-mono bg-gray-100 px-2 py-1 rounded ml-2">
                  {success.verificationCode}
                </span>
              </li>
            </ul>
            <p className="text-sm text-gray-600 mt-4">
              Please save your verification code for your records. 
              A confirmation email has been sent to you.
            </p>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-600">
              Voting closes at: {new Date(success.session.endTime).toLocaleString()}
            </p>
            <a href="/" className="text-uap-maroon underline mt-2 inline-block">Return to Home</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-uap-maroon mb-4">{votingData!.session.title}</h2>
        
        {votingData!.session.description && (
          <p className="text-gray-700 mb-6">{votingData!.session.description}</p>
        )}

        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
          <p className="font-medium">⏰ Voting Deadline</p>
          <p>You must submit your vote before: <strong>{new Date(votingData!.session.endTime).toLocaleString()}</strong></p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Select a Candidate for Board Chairperson:</h3>
          
          {votingData!.candidates.map((candidate) => (
            <div key={candidate.id} className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="candidate"
                  value={candidate.id}
                  checked={selectedCandidate === candidate.id}
                  onChange={(e) => setSelectedCandidate(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-lg">{candidate.name}</h4>
                  {candidate.description && (
                    <p className="text-gray-600 mt-1">{candidate.description}</p>
                  )}
                </div>
              </label>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={submitVote}
            disabled={!selectedCandidate || submitting}
            className="bg-uap-maroon text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-uap-dark transition-colors"
          >
            {submitting ? "Submitting Vote..." : "Submit Vote"}
          </button>
          
          <p className="text-sm text-gray-600 mt-4">
            ⚠️ <strong>Important:</strong> Once you submit your vote, it cannot be changed. 
            Please review your selection carefully.
          </p>
        </div>
      </div>
    </main>
  );
}
