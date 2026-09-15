# TV-style market news strip

## What will change
- Replace the large home-page news timeline with a compact, continuously scrolling headline strip.
- Keep a clear “Market News” label, readable separators, and pause the motion when hovered or focused.
- Make headlines clickable so their original articles open in a new tab.
- Show a calm fallback message if live headlines are temporarily unavailable.

## Technical details
- Add a public read-only endpoint that fetches and normalizes current finance headlines from an RSS source, returning no personal data.
- Update the existing news component to load that feed and render a seamless repeated ticker.
- Add reduced-motion support so users who disable animation see a static, horizontally scrollable strip.
- Verify the home page on mobile and desktop and confirm the project builds cleanly.
