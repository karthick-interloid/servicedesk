import * as React from "react";

/**
 * `Update design.dc.html` switches the shell to an overlay drawer below 1024px
 * (`const narrow = w < 1024`), not below shadcn's stock 768. `ui/sidebar.tsx` picks
 * Sheet-vs-permanent purely from this hook and is not ours to edit, so the breakpoint
 * moves here. Nothing else in the app consumes `useIsMobile`.
 */
const MOBILE_BREAKPOINT = 1024;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
