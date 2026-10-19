/** Shares the production theme and fonts across examples; tooltips bring their own provider. */
import { useEffect, useEffectEvent } from "react";
import type { Preview } from "@storybook/react-vite";
import { GolfoUIProvider, useTheme } from "@golfo/ui";
import "@golfo/ui/styles.css";
import "./preview.css";

/** Applies toolbar changes without preventing the theme component's own interactions. */
function ThemeSync({ theme }: { theme: string }) {
  const { setTheme } = useTheme();
  const applyTheme = useEffectEvent((nextTheme: string) => setTheme(nextTheme));
  useEffect(() => { applyTheme(theme); }, [theme]);
  return null;
}

const preview: Preview = {
  tags: ["autodocs"],
  globalTypes: {
    theme: {
      description: "Tema compartido",
      toolbar: {
        icon: "paintbrush",
        dynamicTitle: true,
        items: [
          { value: "light", title: "Claro" },
          { value: "dark", title: "Oscuro" },
          { value: "system", title: "Sistema" },
        ],
      },
    },
  },
  initialGlobals: { theme: "light" },
  parameters: {
    layout: "padded",
    controls: { expanded: true },
    docs: {
      description: {
        story:
          "Interactuá con el componente o recargá la story para ver su movimiento sutil. Con movimiento reducido en el sistema, las animaciones se desactivan y el contenido sigue disponible.",
      },
    },
    options: { storySort: { method: "alphabetical" } },
  },
  decorators: [
    function WithProviders(Story, context) {
      return (
        <GolfoUIProvider
          themeOptions={{
            storageKey: "golfo-ui-storybook-theme",
            defaultTheme: "light",
          }}
        >
          <ThemeSync theme={context.globals.theme} />
          <div
            className={
              context.parameters.layout === "fullscreen"
                ? "StoryFullscreen"
                : "StoryFrame"
            }
          >
            <Story />
          </div>
        </GolfoUIProvider>
      );
    },
  ],
};

export default preview;
