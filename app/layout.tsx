import Navbar from '@/components/NavBar'
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {/* The children variable represents whatever page the user is currently visiting */}
        {children} 
      </body>
    </html>
  );
}
