"use client";
import { useState } from "react";

export default function VotePage() {
  const [email, setEmail] = useState("");

  async function sendOTP() {
    const res = await fetch("http://localhost:8000/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    alert(data.message);
  }

  return (
    <main className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-uap-maroon mb-4">Enter your email to receive an OTP</h2>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          className="border p-2 mb-4 block w-full max-w-md"
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={sendOTP}>Send OTP</button>
      </div>
    </main>
  );
}
