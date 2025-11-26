import { signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  return user ? (
    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
      <span className="text-xs sm:text-sm text-text truncate max-w-[150px] sm:max-w-none">
        <span className="hidden sm:inline">Logged in as </span>
        <span className="sm:hidden">User: </span>
        {user.email}
      </span>
      <div className="flex gap-2 sm:gap-4 w-full sm:w-1/3 justify-center sm:justify-start">
        <Button asChild size="sm" variant={"default"} className="text-xs sm:text-sm px-3 sm:px-6">
          <Link href="/protected/upgrade">Upgrade</Link>
        </Button>
        <form action={signOutAction} className="w-1/3 sm:w-auto">
          <Button type="submit" size="sm" variant={"default"} className="text-xs sm:text-sm px-3 sm:px-6 w-full sm:w-auto">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  ) : (
    <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-start">
      <Button asChild size="sm" variant={"default"} className="text-xs sm:text-sm px-3 sm:px-6 flex-1 sm:flex-initial">
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"} className="text-xs sm:text-sm px-3 sm:px-6 flex-1 sm:flex-initial">
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
