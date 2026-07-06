import { spriteSvg } from "./state/store";
import { ChartPanel } from "./ui/ChartPanel";
import { Header } from "./ui/Header";
import { ItemBrowser } from "./ui/ItemBrowser";
import { SidePanel } from "./ui/SidePanel";
import { TrendTables } from "./ui/TrendTables";

export function App() {
  return (
    <>
      <div id="scanlines"></div>
      {/* Hidden SVG spritesheet; item icons reference it via <use href="#id"> */}
      <div id="svg-sprite" style={{ display: "none" }} dangerouslySetInnerHTML={{ __html: spriteSvg.value }} />
      <SidePanel />
      <div id="wrap">
        <Header />
        <div id="main-content">
          <ItemBrowser />
          <ChartPanel />
        </div>
        <TrendTables />
      </div>
    </>
  );
}
