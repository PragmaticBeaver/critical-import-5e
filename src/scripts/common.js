import { Logger } from "./log";

const logger = new Logger("common.js");
logger.disable();

export function trimElements(list, delimiter) {
  return list.split(delimiter).map((el) => el.trim());
}

export async function retrieveFromPackSimilar(packName, itemName) {
  const pack = game.packs.get(packName);
  if (!pack) {
    return;
  }

  const similarItem = { similarity: 0, item: undefined };

  pack.index.forEach((i) => {
    const val = calculateSimilarity(itemName, i.name);
    logger.logConsole(`similarity ${val} - ${itemName} - ${i.name}`);
    if (val > similarItem.similarity) {
      similarItem.similarity = val;
      similarItem.item = i;
    }
  });

  if (!similarItem.item) {
    return;
  }

  const doc = await pack.getDocument(similarItem.item._id);
  return doc.toObject();
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
    const name = itemName.includes("(")
      ? itemName.slice(0, itemName.indexOf("(")).trim()
      : itemName;
    const obj = await retrieveFromPack(packName, name);
    items.push(obj);
  }
  return items;
}

export async function retrieveFromPackImg(itemName) {
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

export function setProperty(obj, property, val) {
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

/**
 * Levenshtein distance calculation
 * @param {string} text
 * @param {string} comparison
 * @returns {number} similarity between 0.0 (worst match) to 1.0 (best match)
 */
function calculateSimilarity(text, comparison) {
  let longer = text;
  let shorter = comparison;
  if (text.length < comparison.length) {
    longer = comparison;
    shorter = text;
  }
  const longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (
    (longerLength - calculateDistance(longer, shorter)) /
    parseFloat(longerLength)
  );
}

function calculateDistance(text, comparison) {
  text = text.toLowerCase();
  comparison = comparison.toLowerCase();

  const costs = [];
  for (let i = 0; i <= text.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= comparison.length; j++) {
      if (i == 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (text.charAt(i - 1) != comparison.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[comparison.length] = lastValue;
  }
  return costs[comparison.length];
}
