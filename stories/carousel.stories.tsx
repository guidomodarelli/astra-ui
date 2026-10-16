/** Demonstrates Carousel with editable content and real interactions. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselIndicators,
} from "beez-ui";

/** Editable inputs specific to this example. */
type Args = {
  orientation: "horizontal" | "vertical";
  loop: boolean;
  slides: number;
  indicators: boolean;
};
const meta = {
  title: "Components/Carousel",
  args: {
    orientation: "horizontal",
    loop: false,
    slides: 4,
    indicators: true,
  },
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
    loop: {
      control: "boolean",
    },
    slides: {
      control: {
        type: "range",
        min: 2,
        max: 8,
        step: 1,
      },
    },
    indicators: {
      control: "boolean",
    },
  },
  parameters: { controls: { include: ["orientation", "loop", "slides", "indicators"] } },
  render: ({ orientation, loop, slides, indicators }) => (
    <Carousel
      key={`${orientation}-${loop}`}
      orientation={orientation}
      opts={{ loop }}
      className="StoryCarousel"
    >
      <CarouselContent
        className={
          orientation === "vertical" ? "StoryCarousel__vertical" : undefined
        }
      >
        {Array.from({ length: slides }, (_, index) => (
          <CarouselItem key={index} className="StorySlide">
            <div className="StorySlide__content">Tarjeta {index + 1}</div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
      {indicators ? <CarouselIndicators /> : null}
    </Carousel>
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
