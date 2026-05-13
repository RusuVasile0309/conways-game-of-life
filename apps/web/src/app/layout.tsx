import './global.css';

export const metadata = {
  title: "Conway's Game of Life",
  description: "Interactive Conway's Game of Life simulation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-300 text-neutral-900 min-h-screen">{children}</body>
    </html>
  );
}
