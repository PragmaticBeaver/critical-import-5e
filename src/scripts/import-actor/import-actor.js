import { Logger } from "../log.js";
import { gatherActorData } from "./gather-actor-data.js";
import { createActor } from "./create-actor.js";

const logger = new Logger("import-actor.js");
// logger.disable();

export async function importActor(importedActorData) {
  if (!importedActorData) {
    return;
  }
  const actorData = await gatherActorData(importedActorData);
  logger.logConsole("actorData", actorData);
  await createActor(actorData);
}
