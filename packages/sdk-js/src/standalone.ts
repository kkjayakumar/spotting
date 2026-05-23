import { SpottingClient } from "./client";
import { destroyWidget, mountWidget } from "./ui/widget";
import type { SpottingInitOptions } from "./types";

function init(options: SpottingInitOptions) {
  mountWidget(options);
}

function destroy() {
  destroyWidget();
}

const SpottingCapture = {
  init,
  destroy,
  SpottingClient,
};

declare global {
  interface Window {
    SpottingCapture?: typeof SpottingCapture;
  }
}

if (typeof window !== "undefined") {
  window.SpottingCapture = SpottingCapture;
}

export { init, destroy, SpottingClient, SpottingCapture };
