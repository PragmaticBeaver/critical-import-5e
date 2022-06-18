import { Logger } from "../log.js";

const logger = new Logger("gather-spell-data.js");
// logger.disable();

const VALID_HEADERS = {
  level: "level",
  castingTime: "casting time",
  rangeArea: "range/area",
  components: "components",
  duration: "duration",
  school: "school",
  attackSave: "attack/save",
  damageEffect: "damage/effect",
};

const MATERIAL_COMPONENT_RGX = /-.?-.?\((?<material>.*)?\)/i;
const AT_HIGHER_LEVEL_RGX = /\bat higher levels\b.?\s?(?<higherLevelsDesc>.*)/i;
const AT_HIGHER_LEVEL_DAMAGE_RGX = /(?<dmgRoll>\dd\d)/i;
const TARGET_RGX = /(?<target>\bwilling creature\b|\ba target\b)/i;
const SHAPE_RGX = /(?<shape>[0-9]+\b-foot\b(\s|-)?[a-z]+)/i;
const RANGE_RGX = /((?<type>[a-zA-Z]+)?\s\()?((?<range>\d+)\s\bft\b)/i;
const ATTACK_SAVE_RGX = /((?<ability>[A-Z]{3})\s)?(?<type>[a-zA-Z]+)/;
const DURATION_RGX = /((?<value>\d+)\s+)?(?<type>[a-zA-Z]+)/i;

/**
 * Spell params:
 *
 * level
 * castingTime
 * range/area
 * components
 * componentDesc
 * duration
 * concentration
 * school
 * attack/save
 * damage/effect
 * desc
 * atHigherLevels
 * dmg?
 * hit?
 * special effects like mage armor's AC buff?
 *
 */

// todo  - gather WotC style (Grimhollow PDF's for example)
export function gatherSpellData(importedSpellData) {
  const damageRgx = /(?<dmgRoll>\dd\d)\s?(?<dmgType>[a-z]*)/gi;
  const allDamageRgx =
    /(?<versatile>(\dd\d)\s?([a-z]*)\s\bdamage\b[a-zA-Z\s]+(\bstart\b|\bend\b)[a-zA-Z\s]+\bturn\b)|(?<dmgRoll>\dd\d)\s?(?<dmgType>[a-z]*)/gi;

  logger.logConsole("importedSpellData", importedSpellData);
  const inputPortions = importedSpellData.trim().split(/\n/g);

  const spellDto = {
    name: inputPortions.splice(0, 1)[0],
    rawHeaderData: { other: [] },
  };

  let currentHeader = undefined;
  for (const portion of inputPortions) {
    const value = portion.toLocaleLowerCase();
    if (!value) {
      continue;
    }

    const containsHeader = Object.values(VALID_HEADERS).indexOf(value) > -1;
    if (containsHeader) {
      // is header
      currentHeader = value;
      logger.logConsole("set currentHeader", currentHeader);
    } else if (currentHeader !== undefined) {
      // is value
      // rawSpellDto.rawHeaderData[currentHeader] = portion;

      switch (currentHeader) {
        case VALID_HEADERS.level:
          spellDto.level = parseInt(portion.trim());
          break;

        case VALID_HEADERS.castingTime:
          spellDto.castingTime = parseCastingTime(portion);
          break;

        case VALID_HEADERS.rangeArea:
          spellDto.range = parseRange(portion);
          // todo area
          break;
        case VALID_HEADERS.components:
          spellDto.components = portion;
          break;
        case VALID_HEADERS.duration:
          spellDto.duration = parseDuration(portion);
          break;
        case VALID_HEADERS.school:
          spellDto.school = shortenSpellSchool(portion);
          break;
        case VALID_HEADERS.attackSave:
          const attackOrSave = parseAttackOrSave(portion);
          if (attackOrSave) {
            spellDto.actionType = attackOrSave.actionType;
            spellDto.save = attackOrSave.save;
          }
          break;
        case VALID_HEADERS.damageEffect:
        // todo
        default:
          logger.logWarn(`unknown RawHeader ${currentHeader}`);
          break;
      }

      currentHeader = undefined;
    } else {
      // is value without known header
      spellDto.rawHeaderData.other.push(portion);
    }
  }

  // convert list of unknown data
  for (let i = 0; i < spellDto.rawHeaderData.other?.length; i++) {
    const line = spellDto.rawHeaderData.other[i];

    // specific material components
    const material = MATERIAL_COMPONENT_RGX.exec(line);
    if (material) {
      spellDto.materialComponents = material.groups.material;
    }

    // at higher levels
    const atHigherLevels = AT_HIGHER_LEVEL_RGX.exec(line);
    if (atHigherLevels) {
      const desc = atHigherLevels.groups.higherLevelsDesc;
      spellDto.atHigherLevels = desc;

      const match = AT_HIGHER_LEVEL_DAMAGE_RGX.exec(desc);
      const m = match.groups;
      if (m) {
        spellDto.damageAtHigherLevels = m.dmgRoll;
      }
    }

    // spell description
    const isDesc = !material && !atHigherLevels;
    if (isDesc) {
      const descLine = spellDto.desc ? spellDto.desc + `\n\n${line}` : line;
      spellDto.desc = descLine;
    }
  }
  const desc = spellDto.desc;

  // target
  const target = TARGET_RGX.exec(desc);
  const targetMatch = target?.groups;
  if (targetMatch) {
    // todo evaluate options
    spellDto.target = targetMatch.target;
  }

  // shape
  const shape = SHAPE_RGX.exec(desc);
  const shapeMatch = shape?.groups;
  if (shapeMatch) {
    // todo split string into parameters
    spellDto.shape = shapeMatch.shape;
  }

  // damage
  const dmg = [];
  const versatileDmg = [];
  let match;
  while ((match = allDamageRgx.exec(desc)) != null) {
    const m = match?.groups;
    if (m.dmgRoll || m.dmgType) {
      dmg.push([m.dmgRoll, m.dmgType]);
    } else if (m.versatile) {
      let vMatch;
      while ((vMatch = damageRgx.exec(m.versatile)) != null) {
        const vm = vMatch?.groups;
        if (vm) {
          versatileDmg.push([vm.dmgRoll, vm.dmgType]);
        }
      }
    }
  }

  if (dmg.length > 0) {
    spellDto.damage = dmg;
  }
  if (versatileDmg.length > 0) {
    spellDto.versatileDmg = versatileDmg;
  }

  logger.logConsole("rawSpellDto", spellDto);
  return spellDto;
}

function parseDuration(portion) {
  const match = DURATION_RGX.exec(portion);
  if (!match?.groups) {
    return;
  }

  const groups = match.groups;
  return {
    type: shortenDuration(groups.type),
    value: groups.value ? parseInt(groups.value) : undefined,
  };
}

function parseCastingTime(portion) {
  const casting = portion.split(" ");
  return {
    value: parseInt(casting[0]),
    type: casting[1],
  };
}

function parseRange(portion) {
  const raMatch = RANGE_RGX.exec(portion);
  if (!raMatch.groups) {
    logger.logWarn(`couldn't parse range/area ${portion}`);
    return;
  }

  const mGroups = raMatch.groups;
  return {
    type: mGroups.type ? mGroups.type.toLocaleLowerCase() : "ft",
    normal: parseInt(mGroups.range),
    max: 0,
  };
}

function parseAttackOrSave(portion) {
  const asMatch = ATTACK_SAVE_RGX.exec(portion);
  if (!asMatch.groups) {
    logger.logWarn(`couldn't parse attack/save ${portion}`);
    return;
  }

  const attackOrSave = {};

  const asGroups = asMatch.groups;
  if (asGroups.type) {
    attackOrSave.actionType = shortenAttackOrSave(asGroups.type);
  }
  if (asGroups.ability) {
    attackOrSave.save = {
      ability: asGroups.ability.trim().toLocaleLowerCase(),
      dc: null, // todo
      scaling: "spell", // todo could also be "none" or "cantrip"
    };
  }

  return attackOrSave;
}

function shortenDuration(duration) {
  switch (duration.trim().toLocaleLowerCase()) {
    case "instantaneous":
      return "inst";
    case "hours":
      return "hour";
    case "turns":
      return "turn";
    case "rounds":
      return "round";
    case "minutes":
      return "minute";
    case "days":
      return "day";
    case "months":
      return "month";
    case "years":
      return "year";
    case "permanent":
      return "perm";
    case "special":
      return "spec";
    default:
      return duration;
  }
}

// todo
function shortenSpellSchool(school) {
  switch (school.trim().toLocaleLowerCase()) {
    case "abjuration":
      return "";
    case "transmutation":
      return "";
    case "conjuration":
      return "";
    case "divination":
      return "";
    case "enchantment":
      return "";
    case "evocation":
      return "evo";
    case "illusion":
      return "";
    case "necromancy":
      return "";
    default:
      return school;
  }
}

// todo
function shortenAttackOrSave(attackOrSave) {
  switch (attackOrSave.trim().toLocaleLowerCase()) {
    case "ranged":
      return "rsak";
    case "save":
      return "save";
    default:
      return attackOrSave;
  }
}
