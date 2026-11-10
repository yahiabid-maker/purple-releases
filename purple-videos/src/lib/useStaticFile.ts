import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

/**
 * Vérifie qu'un fichier de public/ existe avant de l'afficher (logo, photo).
 * Le rendu attend la réponse ; un fichier absent est simplement ignoré.
 */
export const useStaticFile = (file: string, expectedType: string) => {
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(file ? "loading" : "missing");
  const [handle] = useState(() => (file ? delayRender(`Recherche de public/${file}`) : null));
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
