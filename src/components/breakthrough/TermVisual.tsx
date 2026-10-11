import type { Visual } from "@/lib/breakthrough/types";
import { CalcVisual } from "./CalcVisual";
import { ClockVisual } from "./ClockVisual";
import { FlowVisual } from "./FlowVisual";
import { DomVisual, FootprintVisual } from "./LadderVisual";
import { SceneChart } from "./SceneChart";

export function TermVisual({ visual }: { visual: Visual }) {
  switch (visual.kind) {
    case "scene":
      return <SceneChart spec={visual.scene} />;
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
