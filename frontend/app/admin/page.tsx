"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState("");

  async function fetchTally() {
    try {
      const res = await fetch("http://localhost:8000/admin/tally", {
        headers: { "x-admin-secret": secret }
      });
      if (!res.ok) throw new Error("Invalid admin secret");
      const result = await res.json();
      setData(result);
      setError("");
    } catch (err) {
      setError("Unauthorized. Check your admin password.");
    }
  }

  const handleDownload = () => {
    window.open(`http://localhost:8000/admin/results`, "_blank");
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    await fetchTally();
  };

  return (
    <main className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-uap-maroon mb-4">Admin Panel</h1>

        {!submitted ? (
          <>
            <label className="block mb-2 font-medium">Enter Admin Password:</label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="border p-2 mb-4 block w-full max-w-sm"
            />
            <button onClick={handleSubmit}>Access Admin Panel</button>
          </>
        ) : error ? (
          <>
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={() => setSubmitted(false)}>Try Again</button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-4">Vote Tally</h2>
            <BarChart width={500} height={300} data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="candidate" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="votes" fill="#7a0026" />
            </BarChart>
            <button className="mt-6" onClick={handleDownload}>
              Download Results CSV
            </button>
          </>
        )}
      </div>
    </main>
  );
}
