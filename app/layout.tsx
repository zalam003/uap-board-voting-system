import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>
        <header className="bg-[#7a0026] text-white p-4 shadow-md">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <img src="/logo.png" alt="UAP Logo" className="h-12 w-auto" />
            <h1 className="text-xl font-semibold">University of Asia Pacific – Board Voting System</h1>
          </div>
        </header>
        <main className="bg-white min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
