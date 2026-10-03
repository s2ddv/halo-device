import { useEffect, useState } from "react";
import { Icon } from "@/components/AppShell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
const phases = ["Inspire", "Segure", "Expire", "Pause"];
export function BreathingExercise() {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (start === null) return;
    const id = window.setInterval(() => {
      const next = Math.min(180, Math.floor((Date.now() - start) / 1000));
      setElapsed(next);
      if (next === 180) setStart(null);
    }, 250);
    return () => window.clearInterval(id);
  }, [start]);
  function close(value: boolean) {
    setOpen(value);
    if (!value) {
      setStart(null);
      setElapsed(0);
    }
  }
  const phase = phases[Math.floor(elapsed / 4) % 4];
  const remaining = 180 - elapsed;
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <button type="button" className="primary-button w-full">
          <Icon name="play_arrow" />
          Iniciar respiração guiada
        </button>
      </DialogTrigger>
      <DialogContent className="halo-dialog">
        <DialogTitle>Uma pausa para respirar</DialogTitle>
        <DialogDescription>
          Guia visual de 3 minutos, em etapas de 4 segundos. Respire de forma confortável e
          interrompa se sentir desconforto.
        </DialogDescription>
        <div className="mx-auto my-5 flex h-48 w-48 flex-col items-center justify-center rounded-full border-8 border-oxygen/30 bg-oxygen/5">
          <p className="font-display text-headline-mobile" aria-live="polite">
            {elapsed === 180 ? "Concluído" : start === null ? "Pronto?" : phase}
          </p>
          <p className="mt-3 font-numeric text-title-md" role="timer">
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
          </p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            if (start !== null) {
              setStart(null);
              setElapsed(0);
            } else {
              setElapsed(0);
              setStart(Date.now());
            }
          }}
        >
          {start !== null ? "Interromper exercício" : elapsed === 180 ? "Recomeçar" : "Começar"}
        </button>
        <p className="text-xs text-on-surface-variant">
          Não mede estresse nem altera sua pontuação.
        </p>
      </DialogContent>
    </Dialog>
  );
}
