import { Logger } from "./log";

const logger = new Logger("common.js");
logger.disable();

export function trimElements(list, delimiter) {
  return list.split(delimiter).map((el) => el.trim());
}

export async function retrieveFromPack(packName, itemName) {
  const pack = game.packs.get(packName);
  if (!pack) {
    return;
  }

  const item = pack.index.find(
    (i) => itemName.toLowerCase() === i.name.toLowerCase()
  );
  if (!item) {
    return;
  }

  const doc = await pack.getDocument(item._id);
  return doc.toObject();
}

export async function retrieveFromPackMany(packName, itemNames) {
  const pack = game.packs.get(packName);
  if (!pack) {
    return;
  }

  const items = [];
  for (const itemName of itemNames) {
    logger.logConsole("itemName", itemName);
    const obj = await retrieveFromPack(packName, itemName);
    items.push(obj);
  }
  return items;
}

export async function retrieveFromPackItemImg(itemName) {
  const name = itemName.toLowerCase();

  const item = await retrieveFromPack("dnd5e.items", name);
  logger.logConsole("item", item);
  if (item) {
    return item.img;
  }

  const classFeat = await retrieveFromPack("dnd5e.classfeatures", name);
  logger.logConsole("classFeat", classFeat);
  if (classFeat) {
    return classFeat.img;
  }

  const monsterFeat = await retrieveFromPack("dnd5e.monsterfeatures", name);
  logger.logConsole("monsterFeat", monsterFeat);
  if (monsterFeat) {
    return monsterFeat.img;
  }
}

export function shortenAbility(longAbilityName) {
  switch (longAbilityName.trim().toLowerCase()) {
    case "strength":
      return "str";
    case "dexterity":
      return "dex";
    case "constitution":
      return "con";
    case "intelligence":
      return "int";
    case "wisdom":
      return "wis";
    case "charisma":
      return "cha";
    default:
      logger.logWarn("unknown ability", longAbilityName);
      break;
  }
}
