import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>UAP Board Voting System</title>
        <meta name="description" content="University of Asia Pacific Board of Directors Digital Voting Portal" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <header>
          {/* Maroon Header with Logo and Navigation */}
          <div className="header-maroon text-white shadow-sm">
            <nav className="max-w-6xl mx-auto px-4 py-2">
              <div className="flex items-center justify-between">
                {/* Logo Only */}
                <div className="flex items-center gap-4">
                  <img src="/logo.png" alt="UAP Logo" className="h-12 w-auto" />
                </div>
                
                {/* Navigation Menu */}
                <div className="flex items-center gap-8">
                  <a 
                    href="/" 
                    className="text-white hover:text-yellow-200 transition-colors font-medium text-sm uppercase tracking-wide"
                    title="Home"
                  >
                    HOME
                  </a>
                  <a 
                    href="/governance" 
                    className="text-white hover:text-yellow-200 transition-colors font-medium text-sm uppercase tracking-wide"
                    title="Governance"
                  >
                    GOVERNANCE
                  </a>
                  <a 
                    href="/admin" 
                    className="text-white hover:text-yellow-200 transition-colors font-medium text-sm uppercase tracking-wide"
                    title="Admin Panel"
                  >
                    ADMIN
                  </a>
                  <div className="text-sm opacity-75 font-medium">
                    🔒 SECURE PORTAL
                  </div>
                </div>
              </div>
            </nav>
          </div>
          
          {/* Blue Banner with Board Voting Portal */}
          <div className="header-blue text-white">
            <div className="max-w-6xl mx-auto px-4 py-0">
              <h3 className="text-lg font-bold text-center uppercase tracking-wide py-1">
                UAP Board - Voting Portal
              </h3>
            </div>
          </div>
        </header>
        <main className="bg-white min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
