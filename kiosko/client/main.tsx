import { hydrate } from "preact";
import { App } from "./App";
import type { Menu } from "../../shared/types";

const root = document.getElementById("app")!;
const menu = JSON.parse(document.getElementById("menu")!.textContent!) as Menu;

hydrate(<App menu={menu} open={root.dataset.open !== "0"} preview={root.dataset.preview === "1"} />, root);
