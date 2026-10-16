"use client";

/**
 * Arc's Pagination (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): previous and next arrows around a
 * sliding five page window, with a current-page mark that glides to the selected page. Arc's API (`page`,
 * `pageCount`, `onPageChange`, `label`), with beez-ui's extensions: links through the provider's `Link` adapter
 * (`getHref`), cursor paging without a page count (`hasNextPage`), arrow labels and Spanish copy.
 */
import type { MouseEvent } from "react"

import { PAGINATION_DEFAULT_COPY, PAGINATION_FIRST_PAGE, PAGINATION_WINDOW_SIZE } from "../constants/pagination.js"
import {
  PaginationButton,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationRoot,
  PaginationStep,
} from "./primitives/pagination.js"

/**
 * Click that requested a page, from a page link or button or an arrow. Call `event.preventDefault()` on a link to keep
 * the provider's `Link` from navigating, for example to page in place on plain clicks while modified clicks still
 * open the address in a new tab.
 */
export type PaginationClickEvent = MouseEvent<HTMLAnchorElement | HTMLButtonElement>

/** Called with the requested page and the click that requested it. */
export type PaginationPageChangeHandler = (page: number, event: PaginationClickEvent) => void

/** Props shared by every way of paging. */
type PaginationBaseProps = {
  /** Current page, 1-based. Clamped to the range. */
  page: number
  /**
   * Total pages. Zero renders an empty landmark. Leave it out for cursor paging: only the arrows render, and
   * `hasNextPage` decides whether the next one is enabled.
   */
  pageCount?: number
  /** Whether a page follows the current one, for cursor paging without `pageCount`. Ignored with `pageCount`. */
  hasNextPage?: boolean
  /** Accessible name of the navigation landmark. Defaults to "Paginación". */
  label?: string
  /** Visible label of the previous arrow, hidden on small screens. Defaults to "Anterior". */
  previousLabel?: string
  /** Visible label of the next arrow, hidden on small screens. Defaults to "Siguiente". */
  nextLabel?: string
  /** Classes of the navigation landmark. */
  className?: string
}

/** Props of `Pagination`: buttons that report the page, or links built with `getHref`. */
export type PaginationProps = PaginationBaseProps &
  (
    | {
        /** Called with the requested page and the click event. */
        onPageChange: PaginationPageChangeHandler
        getHref?: undefined
      }
    | {
        /**
         * Called with the requested page and the click event when a link is clicked, before it navigates. Calling
         * `event.preventDefault()` cancels the navigation of that link.
         */
        onPageChange?: PaginationPageChangeHandler
        /**
         * Builds the address of a page. Every control becomes a link rendered through the provider's `Link` adapter,
         * so pages live in the URL and render on the server.
         */
        getHref: (page: number) => string
      }
  )

/**
 * Lists the pages of the window around the current page.
 * @param currentPage - Clamped current page.
 * @param pageCount - Total pages.
 * @returns The visible page numbers, in order.
 */
function getVisiblePages(currentPage: number, pageCount: number): number[] {
  const halfWindow = Math.floor(PAGINATION_WINDOW_SIZE / 2)
  const start = Math.max(
    PAGINATION_FIRST_PAGE,
    Math.min(pageCount - PAGINATION_WINDOW_SIZE + 1, currentPage - halfWindow)
  )
  return Array.from({ length: Math.min(pageCount, PAGINATION_WINDOW_SIZE) }, (_, index) => start + index)
}

/**
 * Previous and next arrows around a five page window. Disabled arrows keep `aria-disabled` and never request a page.
 * @param props - Current page, page count or next-page flag, handlers and copy.
 * @returns The navigation landmark.
 */
function Pagination({
  page,
  pageCount,
  hasNextPage = false,
  onPageChange,
  getHref,
  label = PAGINATION_DEFAULT_COPY.navigationLabel,
  previousLabel = PAGINATION_DEFAULT_COPY.previousText,
  nextLabel = PAGINATION_DEFAULT_COPY.nextText,
  className,
}: PaginationProps) {
  const isCursor = pageCount === undefined
  const safePageCount = isCursor ? 0 : Math.max(0, Math.floor(pageCount))

  if (!isCursor && safePageCount === 0) return <PaginationRoot aria-label={label} className={className} />

  const lowestPage = Math.max(PAGINATION_FIRST_PAGE, Math.floor(page))
  const currentPage = isCursor ? lowestPage : Math.min(lowestPage, safePageCount)
  const isFirst = currentPage <= PAGINATION_FIRST_PAGE
  const isLast = isCursor ? !hasNextPage : currentPage >= safePageCount
  /** Address of a page; a disabled arrow points at the current page and never navigates. */
  const hrefOf = (target: number) => getHref?.(target)

  return (
    <PaginationRoot aria-label={label} className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationStep
            direction="previous"
            text={previousLabel}
            label={previousLabel === PAGINATION_DEFAULT_COPY.previousText ? PAGINATION_DEFAULT_COPY.previousLabel : previousLabel}
            href={hrefOf(isFirst ? currentPage : currentPage - 1)}
            disabled={isFirst}
            onClick={(event) => onPageChange?.(currentPage - 1, event)}
          />
        </PaginationItem>
        {isCursor
          ? null
          : getVisiblePages(currentPage, safePageCount).map((pageNumber) => {
              const controlProps = {
                isActive: pageNumber === currentPage,
                "aria-label": `${PAGINATION_DEFAULT_COPY.pageLabelPrefix} ${pageNumber}`,
                onClick: (event: PaginationClickEvent) => onPageChange?.(pageNumber, event),
                children: pageNumber,
              }
              return (
                <PaginationItem key={pageNumber}>
                  {getHref ? (
                    <PaginationLink href={getHref(pageNumber)} {...controlProps} />
                  ) : (
                    <PaginationButton {...controlProps} />
                  )}
                </PaginationItem>
              )
            })}
        <PaginationItem>
          <PaginationStep
            direction="next"
            text={nextLabel}
            label={nextLabel === PAGINATION_DEFAULT_COPY.nextText ? PAGINATION_DEFAULT_COPY.nextLabel : nextLabel}
            href={hrefOf(isLast ? currentPage : currentPage + 1)}
            disabled={isLast}
            onClick={(event) => onPageChange?.(currentPage + 1, event)}
          />
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  )
}

export { Pagination }
