import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function InfoDialog({
  title,
  description,
  trigger,
  children,
}: {
  title: string;
  description: string;
  trigger: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="halo-dialog">
        <DialogTitle className="font-display text-title-md pr-8">{title}</DialogTitle>
        <DialogDescription className="leading-relaxed">{description}</DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}
