import { render } from "preact";
import { Chart } from "chart.js/auto";
import { App } from "./app";
import { loadMarketData, loadSprite } from "./data/load";
import { theme } from "./state/store";
import "./styles.css";

Chart.defaults.font.family = "'Roboto', sans-serif";
document.body.dataset.theme = theme.value;

void loadSprite();
void loadMarketData();

render(<App />, document.getElementById("app")!);
