import { Logger } from "../log.js";
import {
  retrieveFromPackMany,
  retrieveFromPackImg,
  shortenAbility,
  setProperty,
} from "./../common.js";

const logger = new Logger("create-actor.js");
logger.disable();

// todo - refactor =>
// create-script should only create not mutate!
// mutation should be done inside gather script!

export async function createActor(actorData) {
  const actor = await Actor.create({
    name: actorData.race?.name || "New Actor",
    type: "npc",
  });

  let updateData = {};

  // source
  setProperty(updateData, "data.details.source", "Critical Import 5e");

  // attributes & initiative
  if (actorData.attributes) {
    updateData = setAttributes(updateData, actorData);
  }

  // saves
  if (actorData.saves) {
    updateData = setSaves(updateData, actorData);
  }

  // speed / movement
  if (actorData.speed) {
    updateData = setSpeed(updateData, actorData);
  }

  // health
  if (actorData.health) {
    updateData = setHealth(updateData, actorData);
  }

  // challenge
  if (actorData.challenge) {
    updateData = setChallenge(updateData, actorData);
  }

  // armor
  if (actorData.armor) {
    updateData = await setArmor(updateData, actorData);
  }

  // racial data
  if (actorData.race) {
    updateData = setRace(updateData, actorData);
  }

  // damage resistances
  if (actorData.dmgResistances) {
    updateData = setResistances(updateData, actorData);
  }

  // damage immunities
  if (actorData.dmgImmunities) {
    updateData = setDmgImmunities(updateData, actorData);
  }

  // damage vulnerability
  if (actorData.dmgVulnerabilities) {
    updateData = setDmgVulnerabilities(updateData, actorData);
  }

  // conditional immunities
  if (actorData.conditionImmunities) {
    updateData = setConditionImmunities(updateData, actorData);
  }

  // languages
  if (actorData.languages) {
    updateData = setLanguages(updateData, actorData);
  }

  // proficiency bonus
  if (actorData.proficiencyBonus) {
    setProperty(
      updateData,
      "data.data.attributes.prof",
      parseInt(actorData.proficiencyBonus.profBonus)
    );
  }

  await actor.update(updateData);

  // skills
  if (actorData.skills) {
    // has to be done after basic information has been set
    const skills = createSkills(actorData.skills, actor);
    const skillsUpdate = {
      "data.skills.acr.value": skills.acr,
      "data.skills.ani.value": skills.ani,
      "data.skills.arc.value": skills.arc,
      "data.skills.ath.value": skills.ath,
      "data.skills.dec.value": skills.dec,
      "data.skills.his.value": skills.his,
      "data.skills.ins.value": skills.ins,
      "data.skills.itm.value": skills.itm,
      "data.skills.inv.value": skills.inv,
      "data.skills.med.value": skills.med,
      "data.skills.nat.value": skills.nat,
      "data.skills.prf.value": skills.prf,
      "data.skills.prc.value": skills.prc,
      "data.skills.per.value": skills.per,
      "data.skills.rel.value": skills.rel,
      "data.skills.slt.value": skills.slt,
      "data.skills.ste.value": skills.ste,
      "data.skills.sur.value": skills.sur,
    };
    await actor.update(skillsUpdate);
  }

  // senses
  if (actorData.senses) {
    await updateSenses(actor, actorData.senses);
  }

  // spells
  if (actorData.spellcasting) {
    setProperty(
      updateData,
      "data.attributes.spellcasting",
      actorData.spellcasting.basics
        ? shortenAbility(actorData.spellcasting.basics?.ability)
        : ""
    );
    await updateSpells(actor, actorData.spellcasting);
  }

  // feats
  if (actorData.features) {
    await updateFeats(actor, actorData.features);
  }

  // actions
  if (actorData.actions) {
    await updateActions(actor, actorData, actorData.actions, "action");
  }

  // bonus actions => monsters usualy dont get bonus actions BUT NPCs do!
  if (actorData.bonusActions) {
    await updateActions(actor, actorData, actorData.bonusActions, "bonus");
  }

  // reactions => monsters usualy dont get reactions (except the attack of opportunity) BUT NPCs do!
  if (actorData.reactions) {
    await updateActions(actor, actorData, actorData.reactions, "reaction");
  }

  // legendary resistances
  if (actorData.legendaryResistances) {
    await updateLegendaryResistances(actor, actorData.legendaryResistances);
  }

  // legendary actions
  if (actorData.legendaryActions) {
    const legAction = actorData.legendaryActions;
    await updateLegendaryActions(actor, legAction);
  }

  // todo
  // // "Lair-Actions"-feat
  // otherFeats.push({
  //   name: "Lair Actions",
  //   desc: undefined,
  // });

  // // "Regial-Effects"-feat
  // otherFeats.push({
  //   name: "Regial Effects",
  //   desc: undefined,
  // });

  logger.logConsole("actor", actor);
}

function setAttributes(updateData, actorData) {
  // CHA
  if (actorData.attributes.cha) {
    setProperty(
      updateData,
      "data.abilities.cha.value",
      actorData.attributes.cha.base
    );
    setProperty(
      updateData,
      "data.abilities.cha.mod",
      actorData.attributes.cha.mod
    );
  }

  // CON
  if (actorData.attributes.con) {
    setProperty(
      updateData,
      "data.abilities.con.value",
      actorData.attributes.con.base
    );
    setProperty(
      updateData,
      "data.abilities.con.mod",
      actorData.attributes.con.mod
    );
  }

  // DEX
  if (actorData.attributes.dex) {
    setProperty(
      updateData,
      "data.abilities.dex.value",
      actorData.attributes.dex.base
    );
    setProperty(
      updateData,
      "data.abilities.dex.mod",
      actorData.attributes.dex.mod
    );
    // initiative
    setProperty(
      updateData,
      "data.attributes.init.bonus",
      actorData.attributes.dex.mod
    );
  }

  // INT
  if (actorData.attributes.int) {
    setProperty(
      updateData,
      "data.abilities.int.value",
      actorData.attributes.int.base
    );
    setProperty(
      updateData,
      "data.abilities.int.mod",
      actorData.attributes.int.mod
    );
  }

  // STR
  if (actorData.attributes.str) {
    setProperty(
      updateData,
      "data.abilities.str.value",
      actorData.attributes.str.base
    );
    setProperty(
      updateData,
      "data.abilities.str.mod",
      actorData.attributes.str.mod
    );
  }

  // WIS
  if (actorData.attributes.wis) {
    setProperty(
      updateData,
      "data.abilities.wis.value",
      actorData.attributes.wis.base
    );
    setProperty(
      updateData,
      "data.abilities.wis.mod",
      actorData.attributes.wis.mod
    );
  }

  return updateData;
}

function setSaves(updateData, actorData) {
  // "proficient" represents save value

  // CHA
  setProperty(
    updateData,
    "data.abilities.cha.proficient",
    actorData.saves.cha ? 1 : 0
  );
  // CON
  setProperty(
    updateData,
    "data.abilities.con.proficient",
    actorData.saves.con ? 1 : 0
  );
  // DEX
  setProperty(
    updateData,
    "data.abilities.dex.proficient",
    actorData.saves.dex ? 1 : 0
  );
  // INT
  setProperty(
    updateData,
    "data.abilities.int.proficient",
    actorData.saves.int ? 1 : 0
  );
  // STR
  setProperty(
    updateData,
    "data.abilities.str.proficient",
    actorData.saves.str ? 1 : 0
  );
  // WIS
  setProperty(
    updateData,
    "data.abilities.wis.proficient",
    actorData.saves.wis ? 1 : 0
  );

  return updateData;
}

function setSpeed(updateData, actorData) {
  const speeds = {};
  actorData.speed.forEach((s) => {
    speeds[s.type] = s.value;
  });

  // base speed
  setProperty(
    updateData,
    "data.attributes.speed.value",
    parseInt(speeds.speed)
  );
  setProperty(
    updateData,
    "data.attributes.movement.walk",
    parseInt(speeds.speed)
  );

  // burrow
  setProperty(
    updateData,
    "data.attributes.movement.burrow",
    parseInt(speeds.burrow)
  );

  // climb
  setProperty(
    updateData,
    "data.attributes.movement.climb",
    parseInt(speeds.climb)
  );

  // fly
  setProperty(updateData, "data.attributes.movement.fly", parseInt(speeds.fly));

  // swim
  setProperty(
    updateData,
    "data.attributes.movement.swim",
    parseInt(speeds.swim)
  );

  // hover
  setProperty(
    updateData,
    "data.attributes.movement.hover",
    parseInt(speeds.hover)
  );

  return updateData;
}

function setHealth(updateData, actorData) {
  // HP current
  setProperty(updateData, "data.attributes.hp.value", actorData.health.hp);
  // HP max
  setProperty(updateData, "data.attributes.hp.max", actorData.health.hp);
  // Formular
  setProperty(
    updateData,
    "data.attributes.hp.formula",
    actorData.health.formularBonus
      ? `${actorData.health.formular} + ${actorData.health.formularBonus}`
      : actorData.health.formular
  );

  return updateData;
}

function setChallenge(updateData, actorData) {
  // CR
  setProperty(updateData, "data.details.cr", actorData.challenge.cr);
  // XP
  setProperty(updateData, "data.details.xp.value", actorData.challenge.xp);
  return updateData;
}

async function setArmor(updateData, actorData) {
  if (actorData.armor.item) {
    // todo add item to actor
  }

  setProperty(
    updateData,
    "data.attributes.ac.calc",
    formatArmor(actorData.armor)
  );

  setProperty(
    updateData,
    "data.attributes.ac.flat",
    actorData.armor.armorClass?.trim()
  );

  return updateData;
}

function setRace(updateData, actorData) {
  setProperty(
    updateData,
    "data.details.alignment",
    actorData.race.alignment?.trim()
  );
  setProperty(updateData, "data.details.race", actorData.race.race?.trim());
  setProperty(updateData, "data.details.type", actorData.race.type?.trim());
  setProperty(updateData, "data.traits.size", formatSize(actorData.race));

  return updateData;
}

function setResistances(updateData, actorData) {
  setProperty(
    updateData,
    "data.traits.dr.value",
    actorData.dmgResistances.resistances
  );
  setProperty(
    updateData,
    "data.traits.dr.custom",
    actorData.dmgResistances.custom
  );
  return updateData;
}

function setDmgImmunities(updateData, actorData) {
  setProperty(
    updateData,
    "data.traits.di.value",
    actorData.dmgImmunities.immunities
  );
  setProperty(
    updateData,
    "data.traits.di.custom",
    actorData.dmgImmunities.custom
  );
  return updateData;
}

function setDmgVulnerabilities(updateData, actorData) {
  setProperty(
    updateData,
    "data.traits.dv.value",
    actorData.dmgVulnerabilities.vulnerabilities
  );
  setProperty(
    updateData,
    "data.traits.dv.custom",
    actorData.dmgVulnerabilities.custom
  );
  return updateData;
}

function setConditionImmunities(updateData, actorData) {
  setProperty(
    updateData,
    "data.traits.ci.value",
    actorData.conditionImmunities.immunities
  );
  setProperty(
    updateData,
    "data.traits.ci.custom",
    actorData.conditionImmunities.custom
  );
  return updateData;
}

function setLanguages(updateData, actorData) {
  setProperty(
    updateData,
    "data.traits.languages.value",
    actorData.languages.langs
  );
  setProperty(
    updateData,
    "data.traits.languages.custom",
    actorData.languages.custom
  );
  return updateData;
}

async function updateLegendaryResistances(actor, legendaryResistances) {
  // actor
  const perDay = parseInt(legendaryResistances.timesADay);
  await actor.update({
    "data.resources.legres.value": perDay,
    "data.resources.legres.max": perDay,
  });
  //  feat
  const name = "Legendary Resistance";
  const itemUpdate = {
    name,
    type: "feat",
    img: await retrieveFromPackImg(name),
  };
  setProperty(itemUpdate, "data.description.value", legendaryResistances.desc);
  setProperty(itemUpdate, "data.activation.type", "special");
  setProperty(itemUpdate, "data.consume.type", "attribute");
  setProperty(itemUpdate, "data.consume.target", "resources.legres.value");
  setProperty(itemUpdate, "data.consume.amount", 1);

  const doc = new Item(itemUpdate).toObject();
  await actor.createEmbeddedDocuments("Item", [doc]);
}

async function updateSpells(actor, spellcasting) {
  // spells
  const spellPack = "dnd5e.spells";

  if (spellcasting.basics.innate) {
    // at will
    const spellsAtWill = spellcasting.spells?.atWill;
    if (spellsAtWill) {
      const atWillSpellDocs = await retrieveFromPackMany(
        spellPack,
        spellsAtWill
      );
      for (const doc of atWillSpellDocs) {
        doc["data.preparation.mode"] = "atwill";
        doc["data.preparation.prepared"] = true;
        await actor.createEmbeddedDocuments("Item", [doc]);
      }
    }

    // per day
    const spellLists = spellcasting.spells?.spellList;
    if (spellLists) {
      for (const spellList of spellLists) {
        const spellDocs = await retrieveFromPackMany(
          spellPack,
          spellList.spells
        );
        for (const doc of spellDocs) {
          const usesPerDay = spellList.timesPerDay;
          setProperty(doc, "data.uses.value", usesPerDay);
          setProperty(doc, "data.uses.max", usesPerDay);
          setProperty(doc, "data.uses.per", "day");
          setProperty(doc, "data.preparation.mode", "innate");
          setProperty(doc, "data.preparation.prepared", true);
          await actor.createEmbeddedDocuments("Item", [doc]);
        }
      }
    }
  } else if (spellcasting.basics.casting) {
    // cantrips
    const cantrips = spellcasting.spells?.cantrips;
    if (cantrips) {
      const cantripDocs = await retrieveFromPackMany(spellPack, cantrips);
      for (const doc of cantripDocs) {
        await actor.createEmbeddedDocuments("Item", [doc]);
      }
    }
    // spells
    const spellList = spellcasting.spells?.spellList;
    if (spellList) {
      for (const spellLevel of spellList) {
        const level = spellLevel.level;
        const slots = spellLevel.slots;
        const update = {};
        setProperty(update, `data.spells.spell${level}.value`, slots);
        setProperty(update, `data.spells.spell${level}.max`, slots);
        setProperty(update, `data.spells.spell${level}.override`, slots);
        await actor.update(update);

        const spells = spellLevel.spells;
        const spellDocs = await retrieveFromPackMany(spellPack, spells);
        for (const doc of spellDocs) {
          await actor.createEmbeddedDocuments("Item", [doc]);
        }
      }
    }
  }
}

async function updateFeats(actor, features) {
  for (const feat of features) {
    const featData = {
      name: feat.name,
      type: "feat",
      img: await retrieveFromPackImg(feat.name),
      // effects: undefined // effects of embeded-documents are currently not supported by FoundryVTT => maybe create feats as seperate document and link with actor?
    };
    setProperty(featData, "data.description.value", feat.desc);
    logger.logConsole("featData", featData);
    const item = new Item(featData);
    await actor.createEmbeddedDocuments("Item", [item.toObject()]);
  }
}

// actionType can be "action", "reaction", "bonus"
function updateAction(itemUpdate, action, actorData, actionType) {
  // attack
  const isWeaponAttack = action.hit;
  if (isWeaponAttack) {
    itemUpdate.type = "weapon";
    const abilityMod =
      parseInt(actorData.attributes.str.mod) +
        parseInt(actorData.proficiencyBonus.profBonus) ===
      parseInt(action.hit)
        ? "str"
        : "dex";
    setProperty(itemUpdate, "data.ability", abilityMod);
    setProperty(itemUpdate, "data.weaponType", "natural");
    setProperty(itemUpdate, "data.identified", true);
    setProperty(itemUpdate, "data.equipped", true);
    setProperty(itemUpdate, "data.proficient", true);
  }

  // damage
  const parts = [];
  for (const dmg of action.dmg) {
    if (!dmg.formula) {
      continue;
    }

    const f = dmg.formula.trim();
    const idx = f.indexOf(" ");
    let dmgVal;
    if (idx != -1) {
      dmgVal = `${f.substring(0, idx)} + @mod`;
    } else {
      dmgVal = f;
    }
    parts.push([dmgVal, dmg.type]);
  }
  setProperty(itemUpdate, "data.damage.parts", parts);

  // versatile
  const versatile = action.versatile;
  if (versatile) {
    setProperty(itemUpdate, "data.damage.versatile", versatile.dmgroll); // todo use formula + @mod ?
    setProperty(itemUpdate, "data.properties.ver", true);
  }

  // reach
  const reach = action.reach;
  if (reach) {
    setProperty(itemUpdate, "data.reach.value", reach);
    setProperty(itemUpdate, "data.reach.units", "ft");
    setProperty(itemUpdate, "data.actionType", "mwak");

    // melee attack
    if (isWeaponAttack) {
      setProperty(itemUpdate, "data.range.value", `${reach} Feet`);
    }
  }

  // range
  const range = action.range;
  if (range) {
    setProperty(itemUpdate, "data.range.value", range.normal);
    setProperty(itemUpdate, "data.range.long", range.far);
    setProperty(itemUpdate, "data.actionType", "rwak");
    setProperty(itemUpdate, "data.ability", "dex"); // todo always dex?
  }

  // shape
  const shape = action.shape;
  if (shape) {
    setProperty(itemUpdate, "data.target.value", parseInt(shape.range));
    setProperty(itemUpdate, "data.target.type", shape.shape);
    setProperty(itemUpdate, "data.target.units", "ft");
  }

  // saves
  const save = action.savingThrow;
  if (save) {
    setProperty(itemUpdate, "data.actionType", "save");
    setProperty(itemUpdate, "data.save.ability", shortenAbility(save.ability));
    setProperty(itemUpdate, "data.save.dc", save.dc);
    setProperty(itemUpdate, "data.save.scaling", "flat");
  }

  // recharge
  const recharge = action.recharge;
  if (recharge) {
    setProperty(itemUpdate, "data.recharge.value", recharge.from);
    setProperty(itemUpdate, "data.recharge.charged", true);
  }

  // bonus action | reaction
  if (actionType) {
    setProperty(update, "data.activation.cost", 1);
    setProperty(update, "flags.adnd5e.itemInfo.type", actionType);
    setProperty(update, "data.activation.type", actionType);
  }

  return itemUpdate;
}

async function updateActions(actor, actorData, actions, actionType) {
  for (const action of actions) {
    const name = action.name;
    if (!name) {
      return;
    }

    const lowerName = name.toLocaleLowerCase();

    let itemUpdate = {
      name,
      type: "feat",
      img: await retrieveFromPackImg(lowerName),
    };
    setProperty(itemUpdate, "data.description.value", action.desc);
    setProperty(itemUpdate, "data.activation.type", actionType);
    setProperty(itemUpdate, "data.activation.cost", 1);

    if (lowerName !== "multiattack") {
      setProperty(itemUpdate, "data.quantity", 1);

      if (lowerName !== "spellcasting") {
        itemUpdate = updateAction(itemUpdate, action, actorData);
      }
    }

    const doc = new Item(itemUpdate).toObject();
    await actor.createEmbeddedDocuments("Item", [doc]);
  }
}

async function updateLegendaryActions(actor, legendaryActions) {
  const uses = legendaryActions.uses;
  const legendaryResourcesUpdate = {};
  setProperty(legendaryResourcesUpdate, "data.resources.legact.value", uses);
  setProperty(legendaryResourcesUpdate, "data.resources.legact.max", uses);
  await actor.update(legendaryResourcesUpdate);

  for (const legAction of legendaryActions.actions) {
    const itemUpdate = {
      name: legAction.name,
      type: "feat",
      img: await retrieveFromPackImg(legAction.name),
    };
    setProperty(itemUpdate, "flags.adnd5e.itemInfo.type", "legendary");
    setProperty(itemUpdate, "data.activation.type", "legendary");
    setProperty(itemUpdate, "data.activation.cost", legAction.cost);
    setProperty(itemUpdate, "data.consume.type", "attribute");
    setProperty(itemUpdate, "data.consume.target", "resources.legact.value");
    setProperty(itemUpdate, "data.consume.amount", legAction.cost);
    setProperty(itemUpdate, "data.description.value", legAction.desc);
    setProperty(itemUpdate, "data.equipped", true);
    setProperty(itemUpdate, "data.proficient", true);

    const doc = new Item(itemUpdate).toObject();
    await actor.createEmbeddedDocuments("Item", [doc]);
  }

  const name = "Legendary Actions";
  const legendaryActionDesc = {
    name,
    type: "feat",
    img: await retrieveFromPackImg(name),
  };
  setProperty(
    legendaryActionDesc,
    "data.description.value",
    legendaryActions.desc
  );
  const doc = new Item(legendaryActionDesc).toObject();
  await actor.createEmbeddedDocuments("Item", [doc]);
}

async function updateSenses(actor, senses) {
  const updateData = {};
  for (const s of senses) {
    logger.logConsole("s", s);
    setProperty(updateData, `data.attributes.senses.${s.sense}`, s.mod);
  }
  await actor.update(updateData);
}

function formatArmor(armor) {
  if (!armor?.armorType) {
    return "";
  }

  let armorType;
  const type = armor.armorType.trim().toLocaleLowerCase();
  if (type.includes("natural armor")) {
    armorType = "natural";
  } else {
    // todo handle armor items
    armorType = type;
  }
  return armorType;
}

function formatSize(race) {
  let size;
  const sizeData = race?.size?.trim().toLocaleLowerCase();
  switch (sizeData) {
    // case "tiny":
    //   break;
    case "small":
      size = "sm";
      break;
    case "medium":
      size = "med";
      break;
    case "large":
      size = "lg";
      break;
    // case "huge":
    //   break;
    case "gargantuan":
      size = "grg";
      break;
    default:
      size = sizeData;
      break;
  }
  return size;
}

function createSkills(actorSkills, actor) {
  function calcSkillVal(actor, key, val) {
    const attribute = actor.data.data.skills[key].ability;
    const attributeMod = actor.data.data.abilities[attribute].mod;
    const proficiencyBonus = actor.data.data.attributes.prof;
    return (val - attributeMod) / proficiencyBonus;
  }

  const skills = {};
  for (const s in actorSkills) {
    const skillVal = actorSkills[s];
    switch (s.trim().toLocaleLowerCase()) {
      case "acrobatics":
        skills.acr = parseInt(skillVal);
        break;
      case "animal handling":
        skills.ani = parseInt(skillVal);
        break;
      case "arcana":
        skills.arc = parseInt(skillVal);
        break;
      case "athletics":
        skills.ath = parseInt(skillVal);
        break;
      case "deception":
        skills.dec = parseInt(skillVal);
        break;
      case "history":
        skills.his = parseInt(skillVal);
        break;
      case "insight":
        skills.ins = parseInt(skillVal);
        break;
      case "intimidation":
        skills.itm = parseInt(skillVal);
        break;
      case "investigation":
        skills.inv = parseInt(skillVal);
        break;
      case "medicine":
        skills.med = parseInt(skillVal);
        break;
      case "nature":
        skills.nat = parseInt(skillVal);
        break;
      case "performance":
        skills.prf = parseInt(skillVal);
        break;
      case "perception":
        skills.prc = parseInt(skillVal);
        break;
      case "persuasion":
        skills.per = parseInt(skillVal);
        break;
      case "religion":
        skills.rel = parseInt(skillVal);
        break;
      case "sleight of hand":
        skills.slt = parseInt(skillVal);
        break;
      case "stealth":
        skills.ste = parseInt(skillVal);
        break;
      case "survival":
        skills.sur = parseInt(skillVal);
        break;
      default:
        logger.logWarn("unkown skill", s);
        break;
    }
  }
  logger.logConsole("skills", skills);

  for (const skill in skills) {
    const val = skills[skill];
    skills[skill] = calcSkillVal(actor, skill, val);
  }

  logger.logConsole("skills", skills);
  return skills;
}
