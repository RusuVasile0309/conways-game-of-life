import './global.css';

export const metadata = {
  title: "Conway's Game of Life",
  description: "Interactive Conway's Game of Life simulation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100 min-h-screen">{children}</body>
    </html>
  );
}
