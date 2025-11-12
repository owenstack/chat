// convex/convex.config.ts

import actionRetrier from "@convex-dev/action-retrier/convex.config";
import presenseTracker from "@convex-dev/presence/convex.config";
import autumn from "@useautumn/convex/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(actionRetrier);
app.use(presenseTracker);
app.use(autumn);
export default app;
