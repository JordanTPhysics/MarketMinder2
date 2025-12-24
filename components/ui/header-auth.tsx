import { signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

export default async function AuthButton() {
  if (!hasEnvVars) {
    return (
      <>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center">
          <div>
            <Badge
              variant={"default"}
              className="font-normal pointer-events-none text-xs sm:text-sm"
            >
              Please update .env.local file with anon key and url
            </Badge>
          </div>
          <div className="flex gap-2 sm:gap-4">
            <Button
              asChild
              size="sm"
              variant={"outline"}
              disabled
              className="opacity-75 cursor-none pointer-events-none text-xs sm:text-sm"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={"outline"}
              disabled
              className="opacity-75 cursor-none pointer-events-none text-xs sm:text-sm"
            >
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  let user = null;
  try {
    const supabase = await createClient();
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser();
    user = fetchedUser;
  } catch (error) {
    // If fetch fails (network error, invalid URL, etc.), gracefully fall back to showing sign-in/sign-up buttons
    console.error("Failed to fetch user:", error);
  }

  return user ? (
    <div className="flex items-center justify-center sm:justify-start w-full sm:w-auto">
      <div className="relative group">
        <div
          className="hover:scale-105 transition-all duration-300 ease-in-out rounded-full bg-foreground text-text border-2 border-neon-purple w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center text-xl font-semibold cursor-pointer"
          tabIndex={0}
          aria-label="Account menu"
        >
          {user?.email?.charAt(0).toUpperCase()}
        </div>
        <div
          className="hidden group-hover:flex group-focus-within:flex flex-col gap-3 
           md:absolute md:right-0 md:-top-[0.2rem] lg:absolute lg:right-0 lg:-top-[0.2rem] mt-0 w-64
            bg-background/50 backdrop-blur-sm border border-neon-purple rounded-lg shadow-xl p-4 z-[50]">
          <div className="text-left">
            <p className="text-xs uppercase tracking-wide text-text/70">Signed in as</p>
            <Link href="/protected/account" className="text-sm font-semibold text-text break-words hover:underline">{user.email}</Link>
          </div>
          <div className="flex flex-row gap-2">
            <Button asChild size="sm" variant="happy" className="w-full text-xs sm:text-sm">
              <Link href="/protected/upgrade">Upgrade</Link>
            </Button>
            <form action={signOutAction} className="w-full">
              <Button
                type="submit"
                size="sm"
                variant="destructive"
                className="w-full text-xs sm:text-sm hover:scale-95 transition duration-300"
              >
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-start">
      <Button asChild size="sm" variant="happy" className="w-full text-xs sm:text-sm">
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant="happy" className="w-full text-xs sm:text-sm">
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}

