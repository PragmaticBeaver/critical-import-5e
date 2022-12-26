import { Logger } from "./log";

const logger = new Logger("common");
logger.disable();

export function trimElements(list: string, delimiter: string): string[] {
  return list.split(delimiter).map((el) => el.trim());
}

export async function retrieveFromPack(
  packName: string,
  itemName: string
): Promise<any> {
  const pack = (game as Game).packs.get(packName);
  if (!pack) {
    return;
  }

  const item = pack.index.find(
    (i) => itemName.toLowerCase() === i.name?.toLowerCase()
  );
  if (!item) {
    return;
  }

  const doc = await pack.getDocument(item._id);
  return doc?.toObject();
}

export async function retrieveFromPackMany(
  packName: string,
  itemNames: string
): Promise<string[] | undefined> {
  const pack = (game as Game).packs.get(packName);
  if (!pack) {
    return;
  }

  const items = [];
  for (const itemName of itemNames) {
    logger.logConsole("itemName", itemName);
    const name = itemName.includes("(")
      ? itemName.slice(0, itemName.indexOf("(")).trim()
      : itemName;
    const obj = await retrieveFromPack(packName, name);
    items.push(obj);
  }
  return items;
}

export async function retrieveFromPackImg(
  itemName: string
): Promise<string | undefined> {
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

  const spell = await retrieveFromPack("dnd5e.spells", name);
  logger.logConsole("spell", spell);
  if (spell) {
    return spell.img;
  }
}

export function shortenAbility(longAbilityName: string): string | undefined {
  const abilities: Record<string, string> = {
    strength: "str",
    dexterity: "dex",
    constitution: "con",
    intelligence: "int",
    wisdom: "wis",
    charisma: "cha",
  };
  const abilityName = longAbilityName.trim().toLowerCase();
  const ability = abilities[abilityName];

  if (!ability) {
    logger.logWarn("unknown ability", longAbilityName);
    return;
  }

  return ability;
}

export function setProperty(
  obj: Record<string, any>,
  property: string,
  val: any
): Record<string, any> {
  const props = property.split(".");
  const end = props.length - 1;
  let currentObj = obj;

  for (let i = 0; i < props.length; i++) {
    const prop = props[i];

    if (i === end) {
      currentObj[prop] = val;
    } else {
      if (!currentObj[prop]) {
        currentObj[prop] = {};
      }
      currentObj = currentObj[prop];
    }
  }
  return obj;
}
