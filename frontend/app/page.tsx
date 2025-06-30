export default function HomePage() {
  return (
    <main className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-uap-maroon mb-4">UAP Board Voting System</h1>
        <p className="mb-4">Welcome to the secure digital voting portal for the University of Asia Pacific Board.</p>
        <a href="/vote" className="text-uap-maroon underline text-lg font-medium">
          Go to Vote
        </a>
        <a href="/admin" className="text-uap-maroon underline text-lg font-medium">
          Admin Panel
        </a>
      </div>
    </main>
  );
}
