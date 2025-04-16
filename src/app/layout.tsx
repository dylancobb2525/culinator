import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";

export const metadata = {
  title: "Culinator - AI Recipe Generator",
  description: "Generate recipes based on your ideas and available ingredients",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
