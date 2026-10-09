import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
  /** "lg" is the 56x32 touch-friendly switch used on the Settings page. Default is unchanged. */
  size?: "default" | "lg";
};

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  ({ className, size = "default", ...props }, ref) => {
    const large = size === "lg";
    return (
      <SwitchPrimitives.Root
        className={cn(
          "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          large
            ? "h-8 w-14 data-[state=checked]:bg-foreground data-[state=unchecked]:bg-border"
            : "h-5 w-9 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
          className,
        )}
        {...props}
        ref={ref}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            "pointer-events-none block rounded-full shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0",
            large
              ? "h-6 w-6 data-[state=checked]:translate-x-7 data-[state=checked]:bg-background data-[state=unchecked]:bg-muted-foreground"
              : "h-4 w-4 bg-background data-[state=checked]:translate-x-4",
          )}
        />
      </SwitchPrimitives.Root>
    );
  },
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
