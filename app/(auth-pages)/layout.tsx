export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-screen bg-background flex flex-col items-center justify-center min-h-screen">
      {children}
      </div>
  );
}
