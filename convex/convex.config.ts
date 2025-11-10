// convex/convex.config.ts

import actionRetrier from "@convex-dev/action-retrier/convex.config";
import presenseTracker from "@convex-dev/presence/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(actionRetrier);
app.use(presenseTracker);
export default app;
