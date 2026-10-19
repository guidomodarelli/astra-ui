/** Mounts ButtonLink next to Button for every variant and size, so the spec compares how both paint in real engines. */
import { createRoot } from "react-dom/client";
import { GolfoUIProvider, Button, ButtonLink, buttonClassName, type ButtonSize, type ButtonVariant } from "@golfo/ui";
import "./styles.css";

/** Every variant of the Arc button recipe. */
const VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];

/** Every size of the Arc button recipe. */
const SIZES: ButtonSize[] = ["sm", "md", "lg"];

/** Renders one row per variant and size: a Button, a ButtonLink and a label styled with buttonClassName. */
function ButtonLinks() {
  return <GolfoUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}><main>
    <h1>Links con aspecto de botón</h1>
    {VARIANTS.flatMap((variant) => SIZES.map((size) => (
      <section key={`${variant}-${size}`} className="controls" data-row={`${variant}-${size}`}>
        <Button variant={variant} size={size}>Botón</Button>
        <ButtonLink variant={variant} size={size} href="#destino">Botón</ButtonLink>
        <label className={buttonClassName({ variant, size })}>Botón<input type="file" hidden /></label>
      </section>
    )))}
    <p id="destino">Destino</p>
  </main></GolfoUIProvider>;
}

createRoot(document.getElementById("root")!).render(<ButtonLinks />);
