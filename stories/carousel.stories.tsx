/** Demonstrates Carousel with editable content and real interactions. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Carousel } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = {
  slides: number;
  loop: boolean;
  slideSize: string;
  interval: number;
  autoplay: boolean;
  showControls: boolean;
  showIndicators: boolean;
};
const meta = {
  title: "Components/Carousel",
  args: {
    slides: 4,
    loop: false,
    slideSize: "min(80cqw, 340px)",
    interval: 0,
    autoplay: false,
    showControls: true,
    showIndicators: true,
  },
  argTypes: {
    slides: { control: { type: "range", min: 1, max: 8, step: 1 } },
    loop: { control: "boolean" },
    slideSize: { control: "select", options: ["min(80cqw, 340px)", "100%", "60%"] },
    interval: { control: { type: "number", min: 0, step: 500 } },
    autoplay: { control: "boolean" },
    showControls: { control: "boolean" },
    showIndicators: { control: "boolean" },
  },
  parameters: {
    controls: { include: ["slides", "loop", "slideSize", "interval", "autoplay", "showControls", "showIndicators"] },
  },
  render: ({ slides, loop, slideSize, interval, autoplay, showControls, showIndicators }) => (
    <div className="StoryCarousel">
      <Carousel
        key={`${loop}-${autoplay}`}
        label="Tarjetas destacadas"
        loop={loop}
        slideSize={slideSize}
        interval={interval > 0 ? interval : undefined}
        autoplay={autoplay}
        showControls={showControls}
        showIndicators={showIndicators}
      >
        {Array.from({ length: slides }, (_, index) => (
          <div key={index} className="StorySlide__content">
            Tarjeta {index + 1}
          </div>
        ))}
      </Carousel>
    </div>
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
