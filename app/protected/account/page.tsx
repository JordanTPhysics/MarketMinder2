import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4">
      <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-8 border border-border max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-text mb-2">My Account</h1>
        <p className="text-text/80 mb-6">Signed in as <span className="font-semibold">{user.email}</span></p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button asChild variant="outline">
            <Link href="/protected/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/protected/upgrade">Pricing</Link>
          </Button>
          <Button asChild variant="outline" className="md:col-span-2">
            <Link href="/protected">Back to Protected Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}


