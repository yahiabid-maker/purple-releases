import { useEffect, useState } from "react";
import { continueRender, delayRender, getStaticFiles, staticFile } from "remotion";

/**
 * Vérifie qu'un fichier de public/ existe avant de l'afficher (logo, photo).
 * Le rendu attend la réponse ; un fichier absent est simplement ignoré.
 */
/** Vrai si le fichier est absent de public/ (liste connue dans le Studio et au rendu). */
const knownMissing = (file: string) => {
  const files = getStaticFiles();
  return files.length > 0 && !files.some((f) => f.name === file);
};

export const useStaticFile = (file: string, expectedType: string) => {
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(file && !knownMissing(file) ? "loading" : "missing");
  const [handle] = useState(() => (file && !knownMissing(file) ? delayRender(`Recherche de public/${file}`) : null));
  useEffect(() => {
    if (!file || handle === null) return;
    fetch(staticFile(file))
      .then((res) => {
        const type = res.headers.get("content-type") ?? "";
        setStatus(res.ok && type.includes(expectedType) ? "ready" : "missing");
      })
      .catch(() => setStatus("missing"))
      .finally(() => continueRender(handle));
  }, [file, expectedType, handle]);
  return status;
};
