export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  return (
    <div className="flex flex-col gap-2 w-fit mx-auto max-w-md text-sm text-white">
      {"success" in message && (
        <div className="text-text border-x-2 border-foreground px-4">
          {message.success}
        </div>
      )}
      {"error" in message && (
        <div className="text-warning border-x-2 border-destructive-foreground px-4">
          {message.error}
        </div>
      )}
      {"message" in message && (
        <div className="text-text border-x-2 px-4">{message.message}</div>
      )}
    </div>
  );
}
