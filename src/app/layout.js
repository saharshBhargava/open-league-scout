import "./globals.css";

export const metadata = {
  title: "Open League Scout",
  description: "Player scouting dashboard for The Open League",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
