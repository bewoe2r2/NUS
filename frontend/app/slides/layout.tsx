export default function SlidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] overflow-hidden">
      {children}
    </div>
  );
}
