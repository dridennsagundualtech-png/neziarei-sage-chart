import type { Visual } from "@/lib/breakthrough/types";
import { CalcVisual } from "./CalcVisual";
import { ClockVisual } from "./ClockVisual";
import { FlowVisual } from "./FlowVisual";
import { DomVisual, FootprintVisual } from "./LadderVisual";
import { SceneChart } from "./SceneChart";

/** `step` lets a parent (a lesson) drive chart scenes; other visuals ignore it. */
export function TermVisual({ visual, step }: { visual: Visual; step?: number }) {
  switch (visual.kind) {
    case "scene":
      return step === undefined ? (
        <SceneChart spec={visual.scene} />
      ) : (
        <SceneChart spec={visual.scene} step={step} />
      );
    case "flow":
      return <FlowVisual spec={visual.flow} />;
    case "calc":
      return <CalcVisual kind={visual.calc} />;
    case "clock":
      return <ClockVisual spec={visual.clock} />;
    case "dom":
      return <DomVisual />;
    case "footprint":
      return <FootprintVisual />;
  }
}
