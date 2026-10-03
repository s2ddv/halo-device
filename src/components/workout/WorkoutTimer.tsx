import { useEffect, useState } from "react";
import { Icon } from "@/components/AppShell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function WorkoutTimer() {
  const [started, setStarted] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [sport, setSport] = useState("Corrida");
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (started === null) return;
    const tick = () => setElapsed(Math.floor((Date.now() - started) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [started]);
  const time = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="primary-button">
          <Icon name="play_arrow" />
          {started === null ? "Cronometrar treino" : `Treino em andamento · ${time}`}
        </button>
      </DialogTrigger>
      <DialogContent className="halo-dialog">
        <DialogTitle>Cronômetro de treino</DialogTitle>
        <DialogDescription>
          Cronometragem nesta sessão. Não mede distância ou calorias e não grava dados de saúde.
        </DialogDescription>
        <label className="flex flex-col gap-2 text-body-sm">
          Atividade
          <select
            value={sport}
            disabled={started !== null}
            onChange={(event) => setSport(event.target.value)}
            className="min-h-11 rounded-lg border border-border bg-card px-3"
          >
            {["Corrida", "Ciclismo", "Caminhada", "Força"].map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <p
          className="py-6 text-center font-numeric text-display-lg"
          role="timer"
          aria-label="Tempo decorrido"
        >
          {time}
        </p>
        {finished && (
          <p role="status" className="text-body-sm">
            {sport} encerrado nesta sessão. Tempo: {time}.
          </p>
        )}
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            if (started !== null) {
              setElapsed(Math.floor((Date.now() - started) / 1000));
              setStarted(null);
              setFinished(true);
            } else {
              setElapsed(0);
              setFinished(false);
              setStarted(Date.now());
            }
          }}
        >
          {started !== null ? "Encerrar treino" : finished ? "Novo treino" : "Iniciar cronômetro"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
