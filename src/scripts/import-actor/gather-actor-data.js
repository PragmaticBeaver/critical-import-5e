import { Logger } from "../log.js";
import { gatherActions } from "./gather-actions.js";
import { gatherSpellcasting } from "./gather-spellcasting.js";
import { retrieveFromPackSimilar } from "./../common.js";

const logger = new Logger("gather-actor-data.js");
logger.disable();

export async function gatherActorData(importedActorData) {
  // Regex needs to be calculated each time a actor is imported. If not, the regex will fail!
  const racialDetailsRgx =
    /(?<name>.+)(\r|\n|\r\n)(?<size>(\bTiny\b|\bSmall\b|\bMedium\b|\bLarge\b|\bHuge\b|\bGargantuan\b))\s(?<type>.+)\s?(?<race>.+)?\s?,\s?(?<alignment>.+)(\r|\n|\r\n)/gi;
  const armorRgx =
    /\barmou?r class\b\s?(?<armorClass>\d+)\s?(\((?<armorType>.+)\))?/gi;
  const healthRgx =
    /(\bhit points\b|\bhp\b)\s?(?<hp>\d+)\s?(\(?(?<formular>\d+d\d+)?(\s?\+\s?(?<formularBonus>\d+))?)?/gi;
  const dmgImmunitiesRgx = /\bdamage immunit(ies|y)\b\s?(?<immunities>.+)/gi;
  const dmgVulnerabilitiesRgx =
    /\bdamage\svulnerabilities\b\s(?<vulnerabilities>.+)/gi;
  const dmgResistancesRgx = /\bdamage\sresistances\b\s(?<resistances>.+)/gi;
  const conditionImmunitesRgx =
    /\bcondition\simmunities\b\s(?<immunities>.+)/gi;
  const languagesRgx = /\blanguages?\b\s(?<languages>.*)/gi;
  const challengeRgx =
    /(\bchallenge\b|\bcr\b)\s?(?<cr>([\d/]+))\s?\((?<xp>[\d,]+)/gi;
  const proficiencyBonusRgx =
    /(\bproficiency bonus\b|\bprof bonus\b)\s?(?<profBonus>\+\d+)/gi;
  const legendaryResistancesRgx =
    /\blegendary resistance\b\s?\(?(?<timesADay>\d+).\bday\b.?\.?(?<desc>.+)/gi;
  const legendaryActionRgx = /\btake\b.+(?<uses>\d+).?\blegendary actions\b/i;
  const legendaryActionCostsRgx = /\bcosts\b.?(?<cost>\d).?\bactions\b/i;

  logger.logConsole("gathering actor data ...");
  const actorData = {};

  const racialDetails = racialDetailsRgx.exec(importedActorData);
  if (racialDetails) {
    actorData.race = racialDetails.groups;
    logger.logConsole("racialDetails", racialDetails.groups);
  }

  const armor = armorRgx.exec(importedActorData);
  if (armor) {
    actorData.armor = armor.groups;

    const type = actorData.armor.armorType;
    const item = await retrieveFromPackSimilar("dnd5e.items", type);
    actorData.armor.item = item;

    logger.logConsole("armor", actorData.armor);
  }

  const health = healthRgx.exec(importedActorData);
  if (health) {
    actorData.health = health.groups;
    logger.logConsole("health", health.groups);
  }

  const speed = gatherSpeed(importedActorData);
  actorData.speed = speed;
  logger.logConsole("speed", speed);

  const attributes = gatherAttributes(importedActorData);
  actorData.attributes = attributes;
  logger.logConsole("attributes", attributes);

  const saves = gatherSaves(importedActorData);
  actorData.saves = saves;
  logger.logConsole("saves", saves);

  const skills = gatherSkills(importedActorData);
  actorData.skills = skills;
  logger.logConsole("skills", skills);

  const dmgImmunities = dmgImmunitiesRgx.exec(importedActorData);
  if (dmgImmunities?.groups) {
    const { values, custom } = parseValueList(dmgImmunities.groups.immunities);
    actorData.dmgImmunities = {
      immunities: values,
      custom,
    };
  }

  const dmgResistances = dmgResistancesRgx.exec(importedActorData);
  if (dmgResistances?.groups) {
    const { values, custom } = parseValueList(
      dmgResistances.groups.resistances
    );
    actorData.dmgResistances = {
      resistances: values,
      custom,
    };
  }

  const dmgVulnerabilities = dmgVulnerabilitiesRgx.exec(importedActorData);
  if (dmgVulnerabilities?.groups) {
    const { values, custom } = parseValueList(
      dmgVulnerabilities.groups.vulnerabilities
    );
    actorData.dmgVulnerabilities = {
      vulnerabilities: values,
      custom,
    };
  }

  const conditionImmunities = conditionImmunitesRgx.exec(importedActorData);
  if (conditionImmunities?.groups) {
    const { values, custom } = parseValueList(
      conditionImmunities.groups.immunities
    );
    actorData.conditionImmunities = {
      immunities: values,
      custom,
    };
  }

  const languages = languagesRgx.exec(importedActorData);
  if (languages?.groups) {
    let { values, custom } = parseValueList(languages.groups.languages);

    for (const language of values) {
      if (!language.includes("languages")) {
        continue;
      }
      custom = custom ? `${language}; ${custom}` : language;
    }

    actorData.languages = {
      langs: values,
      custom,
    };
  }

  const senses = gatherSenses(importedActorData);
  actorData.senses = senses;
  logger.logConsole("senses", senses);

  const challenge = challengeRgx.exec(importedActorData);
  if (challenge) {
    actorData.challenge = challenge.groups;
    logger.logConsole("challenge", challenge.groups);
  }

  const profBonus = proficiencyBonusRgx.exec(importedActorData);
  if (profBonus) {
    actorData.proficiencyBonus = profBonus.groups;
    logger.logConsole("profBonus", profBonus.groups);
  }

  const legendaryResistances = legendaryResistancesRgx.exec(importedActorData);
  if (legendaryResistances) {
    actorData.legendaryResistances = legendaryResistances.groups;
    logger.logConsole("legendaryResistances", legendaryResistances.groups);
  }

  const sections = gatherSections(importedActorData);
  logger.logConsole("sections", sections);

  // Actions
  const act = sections.actions;
  if (act) {
    const actions = gatherActions(act);
    actorData.actions = actions;
    logger.logConsole("actions", actions);
  }

  // bonus actions
  const bActions = sections["bonus actions"];
  if (bActions) {
    const bonusActions = gatherActions(bActions);
    actorData.bonusActions = bonusActions;
    logger.logConsole("bonus actions", bonusActions);
  }
  // Reactions
  const rActions = sections.reactions;
  if (rActions) {
    const reactions = gatherActions(rActions);
    actorData.reactions = reactions;
    logger.logConsole("reactions", reactions);
  }

  // Legendary Actions
  const lActions = sections["legendary actions"];
  if (lActions) {
    // first section is legendary actions description
    const desc = lActions.splice(0, 1)[0];
    actorData.legendaryActions = {};
    actorData.legendaryActions.desc = desc;
    actorData.legendaryActions.uses =
      legendaryActionRgx.exec(desc)?.groups?.uses;
    logger.logConsole("legendary actions desc", desc);
    const legendaryActions = gatherActions(lActions);
    for (const legAction of legendaryActions) {
      const cost =
        legendaryActionCostsRgx.exec(legAction.name)?.groups?.cost || 1;
      legAction.cost = parseInt(cost);
    }
    actorData.legendaryActions.actions = legendaryActions;
    logger.logConsole("legendary actions", legendaryActions);
  }

  // Lair actions
  const lairActions = sections["lair actions"];
  if (lairActions) {
    const lairActions = gatherActions(lairActions);
    actorData.lairActions = lairActions;
    logger.logConsole("lair actions", lairActions);
  }

  // regional effects
  const rEffect = sections["regional effects"];
  if (rEffect) {
    const regionalEffects = gatherActions(rEffect);
    actorData.regionalEffects = regionalEffects;
    logger.logConsole("regional effects", regionalEffects);
  }

  // remove actions for error prevention
  const reducedActorData = removeActions(importedActorData);

  // features
  const features = gatherFeatures(reducedActorData);
  actorData.features = features;
  logger.logConsole("features", features);

  // spellcasting
  const spellcasting = gatherSpellcasting(reducedActorData);
  actorData.spellcasting = spellcasting;
  logger.logConsole("spellcasting", spellcasting);

  return actorData;
}

function removeActions(actorData) {
  const KNOWN_SECTION_HEADERS = [
    "actions",
    "bonus actions",
    "reactions",
    "legendary actions",
    "lair actions",
    "regional effects",
  ];
  const reducedActorData = actorData.trim().split(/\n/g);
  // remove actions to reduce error possibilities
  for (const idx in reducedActorData) {
    const l = reducedActorData[idx];
    if (typeof l !== "string") {
      return reducedActorData;
    }

    const line = l.trim().toLocaleLowerCase();
    if (KNOWN_SECTION_HEADERS.includes(line)) {
      reducedActorData.splice(idx);
      break;
    }
  }
  return reducedActorData;
}

function gatherSpeed(actorData) {
  const speedRgx =
    /(?<type>(speed|climb|fly|burrow|swim))\s+?(?<value>\d+\s?[^,|\r|\n|\r\n]+)\s\bft\b/gi;

  const speed = [];
  let match;
  while ((match = speedRgx.exec(actorData)) != null) {
    const m = match.groups;
    const type = m.type.toLocaleLowerCase();
    const value = m.value.toLocaleLowerCase();
    speed.push({ type, value: value });
  }
  return speed;
}

function gatherAttributes(actorData) {
  const attributesRgx =
    /(?<attribute>[a-zA-z]{3})(\r\n|\r|\n)(?<base>\d+)\s+?\((?<mod>(\+|-)\d+)\)/gi;

  const attributes = {};
  let match;
  while ((match = attributesRgx.exec(actorData)) != null) {
    const m = match.groups;
    attributes[m.attribute.toLocaleLowerCase()] = {
      base: m.base,
      mod: m.mod,
    };
  }
  return attributes;
}

function gatherSaves(actorData) {
  const savesRgx = /(?<ability>str|dex|con|int|wis|cha) (?<mod>(\+|\-)\d+)/gi;

  const saves = {};
  let match;
  while ((match = savesRgx.exec(actorData)) != null) {
    const m = match.groups;
    saves[m.ability.toLocaleLowerCase()] = m.mod;
  }
  return saves;
}

function gatherSkills(actorData) {
  const skillsRgx =
    /(?<skill>acrobatics|arcana|animal handling|athletics|deception|history|insight|intimidation|investigation|medicine|nature|perception|performance|persuasion|religion|sleight of hand|stealth|survival) (?<mod>(\+|\-)\d+)/gi;

  const skills = {};
  let match;
  while ((match = skillsRgx.exec(actorData)) != null) {
    const m = match.groups;
    skills[m.skill] = m.mod;
  }
  return skills;
}

function gatherSenses(actorData) {
  const sensesRgx =
    /(?<sense>darkvision|blindsight|tremorsense|truesight|passive perception)\s?(?<mod>\d+)/gi;

  const senses = [];
  let match;
  while ((match = sensesRgx.exec(actorData)) != null) {
    const m = match.groups;
    senses.push({
      sense: m.sense.toLocaleLowerCase().trim().replace(" ", ""),
      mod: m.mod,
    });
  }
  return senses;
}

function gatherSections(actorData) {
  const sectionHeaders = [
    "actions",
    "bonus actions",
    "reactions",
    "legendary actions",
    "lair actions",
    "regional effects",
  ];
  const sections = {};
  let header = "";
  for (const line of actorData.trim().split(/\n/g)) {
    const l = line.toLocaleLowerCase();
    if (!l) {
      continue;
    } else if (sectionHeaders.includes(l)) {
      header = l;
      sections[header] = [];
    } else if (sections[header]) {
      sections[header].push(line);
    }
  }
  return sections;
}

export function gatherFeatures(actorDataWithoutActions) {
  const featureRgx = /.*(\r|\n|\r\n)+(?<name>[a-zA-Z\s]+)\.(?<desc>.+)/gi;

  const shortActorData = actorDataWithoutActions.join(`\n`);
  const feats = [];
  let match;
  while ((match = featureRgx.exec(shortActorData)) != null) {
    const m = match.groups;
    if (m) {
      feats.push(m);
    }
  }
  return feats;
}

function parseValueList(csvText) {
  if (!csvText) {
    return;
  }

  const text = csvText.trim().toLocaleLowerCase();
  logger.logConsole("types", text);

  if (text.includes(";")) {
    // list with custom conditions
    const sections = text.split(";");
    const vs = sections[0].replace(" ", "").split(",");
    const vals = [];
    for (const v of vs) {
      vals.push(v.trim());
    }
    const custom = sections[1];
    return { values: vals, custom };
  } else if (text.includes("from")) {
    // custom condition only
    return { values: undefined, custom: text };
  } else if (text.includes(",")) {
    // types only
    const vals = [];
    for (const v of text.split(",")) {
      vals.push(v.trim());
    }
    return {
      values: vals,
      custom: undefined,
    };
  } else {
    // single value
    return {
      values: [text.trim()],
      custom: undefined,
    };
  }
}
