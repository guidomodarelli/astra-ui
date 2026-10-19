/** Keeps exiting content mounted long enough to try clicking and focusing it in a real browser. */
import { useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "motion/react";
import { AnimatedCollapse, GolfoUIProvider, Button } from "@golfo/ui";
import "./styles.css";

/** Parent exit long enough to outlast every interaction the spec attempts while it runs. */
const PANEL_EXIT_TRANSITION = { duration: 30 };

/** Removes its content through a slow parent exit, like a closing panel would. */
function LeavingPanel({ children }: { children: ReactNode }) {
  const [isShown, setIsShown] = useState(true);

  return (
    <section aria-label="Panel saliente">
      <button type="button" onClick={() => setIsShown(false)}>
        Cerrar panel
      </button>
      <AnimatePresence>
        {isShown ? (
          <motion.div key="panel" exit={{ opacity: 0.5, transition: PANEL_EXIT_TRANSITION }}>
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

/** Counts activations of controls that should stop responding once their exit starts. */
function ExitInertExamples() {
  const [buttonActivations, setButtonActivations] = useState(0);
  const [regionActivations, setRegionActivations] = useState(0);
  const [isCollapseOpen, setIsCollapseOpen] = useState(false);

  return (
    <GolfoUIProvider>
      <main>
        <h1>Salidas inertes</h1>
        <output aria-label="Activaciones del botón">{buttonActivations}</output>
        <output aria-label="Activaciones de la región">{regionActivations}</output>
        <LeavingPanel>
          <Button onClick={() => setButtonActivations((count) => count + 1)}>Confirmar</Button>
        </LeavingPanel>
        <section aria-label="Región colapsable">
          <button type="button" aria-expanded={isCollapseOpen} onClick={() => setIsCollapseOpen((isOpen) => !isOpen)}>
            Detalles
          </button>
          <AnimatedCollapse isOpen={isCollapseOpen}>
            {/* A native button: only the collapse region, not Button's own presence, can make it inert. */}
            <button type="button" onClick={() => setRegionActivations((count) => count + 1)}>
              Acción interna
            </button>
          </AnimatedCollapse>
        </section>
      </main>
    </GolfoUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<ExitInertExamples />);
