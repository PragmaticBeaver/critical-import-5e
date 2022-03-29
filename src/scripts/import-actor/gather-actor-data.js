import { logConsole } from "../log.js";
import { gatherActions } from "../import-actions.js";
import { gatherFeatures } from "../import-features.js";

export function gatherActorData(importedActorData) {
  const attributesRgx =
    /(?<attribute>[a-zA-z]{3})(\r\n|\r|\n)(?<base>\d+)\s+?\((?<mod>(\+|-)\d+)\)/gi;
  const racialDetailsRgx =
    /(?<name>.+)(\r|\n|\r\n)(?<size>(Tiny|Small|Medium|Large|Huge|Gargantuan))\s(?<type>.+)\s?(?<race>.+)?\s?,\s?(?<alignment>.+)(\r|\n|\r\n)/gi;
  const armorRgx =
    /(armor|armour) class\s?(?<armorClass>\d+)\s?(\((?<armorType>.+)\))?/gi;
  const healthRgx =
    /(hit points|hp)\s?(?<hp>\d+)\s?(\(?(?<formular>\d+d\d+)?(\s?\+\s?(?<formularBonus>\d+))?)?/gi;
  const speedRgx =
    /(?<type>(speed|climb|fly|burrow|swim))\s+?(?<value>\d+\s?[^,|\r|\n|\r\n]+)/gi;
  const savesRgx = /(?<ability>str|dex|con|int|wis|cha) (?<mod>(\+|\-)\d+)/gi;
  const skillsRgx =
    /(?<skill>acrobatics|arcana|animal handling|athletics|deception|history|insight|intimidation|investigation|medicine|nature|perception|performance|persuasion|religion|sleight of hand|stealth|survival) (?<mod>(\+|\-)\d+)/gi;
  const dmgImmunitiesRgx =
    /(damage immunities|damage immunity)\s?(?<immunities>.+)/gi;
  const dmgVulnerabilitiesRgx =
    /\bdamage\svulnerabilities\b\s(?<vulnerabilities>.+)/gi;
  const dmgResistancesRgx = /\bdamage\sresistances\b\s(?<resistances>.+)/gi;
  const conditionImmunitesRgx =
    /\bcondition\simmunities\b\s(?<immunities>.+)/gi;
  const sensesRgx =
    /(?<sense>darkvision|blindsight|tremorsense|truesight|passive perception)\s?(?<mod>\d+)/gi;
  const languagesRgx = /(languages|language)\s?(?<languages>.*)/gi;
  const challengeRgx = /(challenge|cr)\s?(?<cr>([\d/]+))\s?\((?<xp>[\d,]+)/gi;
  const proficiencyBonusRgx =
    /(proficiency bonus|prof bonus)\s?(?<profBonus>\+\d+)/gi;
  const legendaryResistancesRgx =
    /legendary resistance\s?\(?(?<timesADay>\d+).day.?\.?(?<desc>.+)/gi;

  logConsole("gathering actor data ...");
  const actorData = {};

  const racialDetails = racialDetailsRgx.exec(importedActorData);
  if (racialDetails) {
    actorData.race = racialDetails.groups;
    logConsole("racialDetails", racialDetails.groups);
  }

  const armor = armorRgx.exec(importedActorData);
  if (armor) {
    actorData.armor = armor.groups;
    logConsole("armor", armor.groups);
  }

  const health = healthRgx.exec(importedActorData);
  if (health) {
    actorData.health = health.groups;
    logConsole("health", health.groups);
  }

  function gatherSpeed(actorData) {
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
  const speed = gatherSpeed(importedActorData);
  actorData.speed = speed;
  logConsole("speed", speed);

  function gatherAttributes(actorData) {
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
  const attributes = gatherAttributes(importedActorData);
  actorData.attributes = attributes;
  logConsole("attributes", attributes);

  function gatherSaves(actorData) {
    const saves = {};
    let match;
    while ((match = savesRgx.exec(actorData)) != null) {
      const m = match.groups;
      saves[m.ability.toLocaleLowerCase()] = m.mod;
    }
    return saves;
  }
  const saves = gatherSaves(importedActorData);
  actorData.saves = saves;
  logConsole("saves", saves);

  function gatherSkills(actorData) {
    const skills = {};
    let match;
    while ((match = skillsRgx.exec(actorData)) != null) {
      const m = match.groups;
      skills[m.skill] = m.mod;
    }
    return skills;
  }
  const skills = gatherSkills(importedActorData);
  actorData.skills = skills;
  logConsole("skills", skills);

  const dmgImmu = extractDamageTypes(
    dmgImmunitiesRgx.exec(importedActorData),
    "immunities"
  );
  if (dmgImmu) {
    logConsole("dmgImmu", dmgImmu);
    actorData.dmgImmunities = {};
    actorData.dmgImmunities.immunities = dmgImmu.types;
    actorData.dmgImmunities.custom = dmgImmu.custom;
  }

  const dmgRes = extractDamageTypes(
    dmgResistancesRgx.exec(importedActorData),
    "resistances"
  );
  if (dmgRes) {
    logConsole("dmgRes", dmgRes);
    actorData.dmgResistances = {};
    actorData.dmgResistances.resistances = dmgRes.types;
    actorData.dmgResistances.custom = dmgRes.custom;
  }

  const dmgVul = extractDamageTypes(
    dmgVulnerabilitiesRgx.exec(importedActorData),
    "vulnerabilities"
  );
  if (dmgVul) {
    actorData.dmgVulnerabilities = {};
    actorData.dmgVulnerabilities.vulnerabilities = dmgVul.types;
    actorData.dmgVulnerabilities.custom = dmgVul.custom;
  }

  function extractDamageTypes(damageTypes, propName) {
    if (!damageTypes) {
      return;
    }

    const types = damageTypes.groups?.[propName].trim().toLocaleLowerCase();
    logConsole("types", types);
    if (types.includes(";")) {
      // list with custom conditions
      const sections = types.split(";");
      const ts = sections[0].replace(" ", "").split(",");
      const custom = sections[1];
      return { types: ts, custom };
    } else if (types.includes("from")) {
      // custom condition only
      return { types: undefined, custom: types };
    } else {
      return { types: types.replace(" ", "").split(","), custom: undefined };
    }
  }

  const vulnerabilities = dmgVulnerabilitiesRgx.exec(importedActorData);
  if (vulnerabilities) {
    actorData.dmgVulnerabilities = vulnerabilities.groups;
    logConsole("vulnerabilities", vulnerabilities.groups);
  }

  const conditionImmunites = conditionImmunitesRgx.exec(importedActorData);
  if (conditionImmunites) {
    actorData.conditionImmunites = conditionImmunites.groups;
    logConsole("conditionImmunites", conditionImmunites.groups);
  }

  function gatherSenses(actorData) {
    const senses = [];
    let match;
    while ((match = sensesRgx.exec(actorData)) != null) {
      const m = match.groups;
      senses.push({ sense: m.sense.toLocaleLowerCase(), mod: m.mod });
    }
    return senses;
  }
  const senses = gatherSenses(importedActorData);
  actorData.senses = senses;
  logConsole("senses", senses);

  const languages = languagesRgx.exec(importedActorData);
  if (languages) {
    actorData.languages = languages.groups;
    logConsole("languages", languages.groups);
  }

  const challenge = challengeRgx.exec(importedActorData);
  if (challenge) {
    actorData.challenge = challenge.groups;
    logConsole("challenge", challenge.groups);
  }

  const profBonus = proficiencyBonusRgx.exec(importedActorData);
  if (profBonus) {
    actorData.proficiencyBonus = profBonus.groups;
    logConsole("profBonus", profBonus.groups);
  }

  const legendaryResistances = legendaryResistancesRgx.exec(importedActorData);
  if (legendaryResistances) {
    actorData.legendaryResistances = legendaryResistances.groups;
    logConsole("legendaryResistances", legendaryResistances.groups);
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
  const sections = gatherSections(importedActorData);
  logConsole("sections", sections);

  // Actions
  const act = sections.actions;
  if (act) {
    const actions = gatherActions(act);
    actorData.actions = actions;
    logConsole("actions", actions);
  }

  // bonus actions
  const bActions = sections["bonus actions"];
  if (bActions) {
    const bonusActions = gatherActions(bActions);
    actorData.bonusActions = bonusActions;
    logConsole("bonus actions", bonusActions);
  }
  // Reactions
  const rActions = sections.reactions;
  if (rActions) {
    const reactions = gatherActions(rActions);
    actorData.reactions = reactions;
    logConsole("reactions", reactions);
  }

  // Legendary Actions
  const lActions = sections["legendary actions"];
  if (lActions) {
    // first section is legendary actions description
    const desc = lActions.splice(0, 1);
    actorData.legendaryActions = {};
    actorData.legendaryActions.desc = desc;
    logConsole("legendary actions desc", desc); //todo handle desc as feature ?
    const legendaryActions = gatherActions(lActions);
    actorData.legendaryActions.actions = legendaryActions;
    logConsole("legendary actions", legendaryActions);
  }

  // Lair actions
  const layActions = sections["lair actions"];
  if (layActions) {
    const lairActions = gatherActions(layActions);
    actorData.lairActions = lairActions;
    logConsole("lair actions", lairActions);
  }

  // regional effects
  const rEffect = sections["regional effects"];
  if (rEffect) {
    const regionalEffects = gatherActions(rEffect);
    actorData.regionalEffects = regionalEffects;
    logConsole("regional effects", regionalEffects);
  }

  const features = gatherFeatures(importedActorData);
  actorData.features = features;
  logConsole("features", features);

  return actorData;
}
