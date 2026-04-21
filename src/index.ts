import { env } from "#env";
import { bootstrap } from "@constatic/base";
import "#server";

await bootstrap({ meta: import.meta, env });