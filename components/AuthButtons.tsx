import HeaderAuth from './header-auth';
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { EnvVarWarning } from "@/components/env-var-warning";

export default function AuthButtons() {
  return (
    <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
      <HeaderAuth />
    </div>
  );
}