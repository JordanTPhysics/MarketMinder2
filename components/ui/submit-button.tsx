"use client";

import { Button } from "@/components/ui/button";
import { type ComponentProps } from "react";
import { useFormStatus } from "react-dom";

type Props = ComponentProps<typeof Button> & {
  pendingText?: string;
};

export function SubmitButton({
  children,
  pendingText = "Submitting...",
  ...props
}: Props) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="border-2 text-white rounded-md w-fit mx-auto hover:scale-105" aria-disabled={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
