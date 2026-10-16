/** Demonstrates Pagination with Arc's API: the five page window, links and cursor paging. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pagination } from "beez-ui";
import { useArgs } from "storybook/preview-api";
import { LiveArgs } from "./live-args.js";
/** Editable inputs specific to this example. */
type Args = { page: number; pageCount: number; cursor: boolean; hasNextPage: boolean; links: boolean };
const meta = {
  title: "Components/Pagination",
  args: {
    page: 2,
    pageCount: 12,
    cursor: false,
    hasNextPage: true,
    links: false,
  },
  argTypes: {
    page: {
      control: {
        type: "range",
        min: 1,
        max: 20,
        step: 1,
      },
    },
    pageCount: {
      control: {
        type: "range",
        min: 0,
        max: 20,
        step: 1,
      },
    },
    cursor: {
      control: "boolean",
    },
    hasNextPage: {
      control: "boolean",
    },
    links: {
      control: "boolean",
    },
  },
  parameters: { controls: { include: ["page", "pageCount", "cursor", "hasNextPage", "links"] } },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <LiveArgs args={args} names={["page"]} updateArgs={updateArgs}>
        {({ page }, { page: setPage }) =>
          args.links ? (
            <Pagination
              page={page}
              pageCount={args.cursor ? undefined : args.pageCount}
              hasNextPage={args.hasNextPage}
              getHref={(target) => `#pagina-${target}`}
              onPageChange={setPage}
            />
          ) : (
            <Pagination
              page={page}
              pageCount={args.cursor ? undefined : args.pageCount}
              hasNextPage={args.hasNextPage}
              onPageChange={setPage}
            />
          )
        }
      </LiveArgs>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
/** Cursor paging: without a page count only the arrows render. */
export const Cursor: Story = { args: { page: 1, cursor: true, hasNextPage: true } };
/**
 * Links that page in place: `onPageChange` receives the click and cancels the navigation of plain clicks, while
 * clicks with a modifier still open the page's address in a new tab.
 */
export const InPlaceLinks: Story = {
  args: { links: true },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <LiveArgs args={args} names={["page"]} updateArgs={updateArgs}>
        {({ page }, { page: setPage }) => (
          <Pagination
            page={page}
            pageCount={args.pageCount}
            getHref={(target) => `#pagina-${target}`}
            onPageChange={(target, event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              setPage(target);
            }}
          />
        )}
      </LiveArgs>
    );
  },
};
