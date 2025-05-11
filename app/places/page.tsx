import { createClient } from '@/utils/supabase/server';

export default async function Places() {
  const supabase = await createClient();
  const { data: places } = await supabase.from("places").select();

  return <pre>{JSON.stringify(places, null, 2)}</pre>
}