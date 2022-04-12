import { Logger } from "../log.js";
import {
  retrieveFromPackMany,
  retrieveFromPackItemImg,
  shortenAbility,
  setProperty,
} from "./../common.js";

const logger = new Logger("create-actor.js");
logger.disable();

export async function createActor(actorData) {
  const actor = await Actor.create({
    name: actorData.race.name,
    type: "npc",
  });

  const speeds = formatSpeeds(actorData.speed);
  logger.logConsole("speeds", speeds);

  // a single object because multiple "update"-function calls slow the app down
  let updateData = {
    // source
    "data.details.source": "Critical Import 5e",
    // attributes; saves === "proficient"
    "data.abilities.cha.value": actorData.attributes.cha.base,
    "data.abilities.cha.mod": actorData.attributes.cha.mod,
    "data.abilities.cha.proficient": actorData.saves.cha ? 1 : 0,
    "data.abilities.con.value": actorData.attributes.con.base,
    "data.abilities.con.mod": actorData.attributes.con.mod,
    "data.abilities.con.proficient": actorData.saves.con ? 1 : 0,
    "data.abilities.dex.value": actorData.attributes.dex.base,
    "data.abilities.dex.mod": actorData.attributes.dex.mod,
    "data.abilities.dex.proficient": actorData.saves.dex ? 1 : 0,
    "data.abilities.int.value": actorData.attributes.int.base,
    "data.abilities.int.mod": actorData.attributes.int.mod,
    "data.abilities.int.proficient": actorData.saves.int ? 1 : 0,
    "data.abilities.str.value": actorData.attributes.str.base,
    "data.abilities.str.mod": actorData.attributes.str.mod,
    "data.abilities.str.proficient": actorData.saves.str ? 1 : 0,
    "data.abilities.wis.value": actorData.attributes.wis.base,
    "data.abilities.wis.mod": actorData.attributes.wis.mod,
    "data.abilities.wis.proficient": actorData.saves.wis ? 1 : 0,
    // init
    "data.attributes.init.bonus": actorData.attributes?.dex?.mod,
    // speed
    "data.attributes.speed.value": parseInt(speeds.speed),
    "data.attributes.movement.walk": parseInt(speeds.speed),
    "data.attributes.movement.burrow": parseInt(speeds.burrow),
    "data.attributes.movement.climb": parseInt(speeds.climb),
    "data.attributes.movement.fly": parseInt(speeds.fly),
    "data.attributes.movement.swim": parseInt(speeds.swim),
    "data.attributes.movement.hover": parseInt(speeds.hover),
    // health
    "data.attributes.hp.value": actorData.health.hp,
    "data.attributes.hp.max": actorData.health.hp,
    "data.attributes.hp.formula": actorData.health.formularBonus
      ? `${actorData.health.formular} + ${actorData.health.formularBonus}`
      : actorData.health.formular,
    // challenge
    "data.details.cr": actorData.challenge.cr,
    "data.details.xp.value": actorData.challenge.xp,
    // armor
    "data.attributes.ac.calc": formatArmor(actorData.armor),
    "data.attributes.ac.flat": actorData.armor.armorClass?.trim(),
    // racialData
    "data.details.alignment": actorData.race.alignment?.trim(),
    "data.details.race": actorData.race.race?.trim(),
    "data.details.type": actorData.race.type?.trim(),
    "data.traits.size": formatSize(actorData.race),
    // proficiency bonus
    "data.data.attributes.prof": parseInt(
      actorData.proficiencyBonus?.profBonus
    ),
    // damage resistances
    "data.traits.dr.value": actorData.dmgResistances?.resistances,
    "data.traits.dr.custom": actorData.dmgResistances?.custom,
    // damage immunities
    "data.traits.di.value": actorData.dmgImmunities?.immunities,
    "data.traits.di.custom": actorData.dmgImmunities?.custom,
    // damage vulnerability
    "data.traits.dv.value": actorData.dmgVulnerabilities?.vulnerabilities,
    "data.traits.dv.custom": actorData.dmgVulnerabilities?.custom,
    // conditional immunities
    "data.traits.ci.value": actorData.conditionImmunities?.immunities,
    "data.traits.ci.custom": actorData.conditionImmunities?.custom,
    // languages
    "data.traits.languages.value": actorData.languages?.langs,
    "data.traits.languages.custom": actorData.languages?.custom,
    // spellcasting
    "data.attributes.spellcasting": actorData.spellcasting?.basics
      ? shortenAbility(actorData.spellcasting.basics.ability)
      : "",
  };

  // senses
  updateData = setSenses(updateData, actorData.senses);
  await actor.update(updateData);

  // skills
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

  // spells
  if (actorData.spellcasting) {
    await updateSpells(actor, actorData.spellcasting);
  }

  // feats
  if (actorData.features) {
    await updateFeats(actor, actorData.features);
  }

  // actions
  if (actorData.actions) {
    await updateActions(actor, actorData);
  }

  // bonus actions => monsters usualy dont get bonus actions
  // reactions => monsters usualy dont get reactions (except the attack of opportunity)

  // legendary actions
  if (actorData.legendaryActions) {
    await updateLegendaryActions(actor, actorData.legendaryActions);
  }
  // todo
  // const otherFeats = [];
  // // "Legendary Actions"-feat
  // otherFeats.push({
  //   name: "Legendary Actions",
  //   desc: actorData.legendaryActions.desc,
  // });
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
  // await updateFeats(actor, otherFeats);

  // legendary resistances
  if (actorData.legendaryResistances) {
    await updateLegendaryResistances(actor, actorData.legendaryResistances);
  }

  logger.logConsole("actor", actor);
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
    img: await retrieveFromPackItemImg(name),
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
    const spells = spellcasting.spells?.spellList?.spells;
    if (spells) {
      const spellDocs = await retrieveFromPackMany(spellPack, spells);
      for (const doc of spellDocs) {
        const usesPerDay = spells.timesPerDay;
        doc["data.uses.value"] = usesPerDay;
        doc["data.uses.max"] = usesPerDay;
        doc["data.uses.per"] = "day";
        doc["data.preparation.mode"] = "innate";
        doc["data.preparation.prepared"] = true;
        await actor.createEmbeddedDocuments("Item", [doc]);
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
        update[`data.spells.spell${level}.value`] = slots;
        update[`data.spells.spell${level}.max`] = slots;
        update[`data.spells.spell${level}.override`] = slots;
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
      img: await retrieveFromPackItemImg(feat.name),
      data: {
        description: {
          value: feat.desc,
        },
      },
      // effects: undefined // effects of embeded-documents are currently not supported by FoundryVTT => maybe create feats as seperate document and link with actor?
    };
    logger.logConsole("featData", featData);
    const item = new Item(featData);
    await actor.createEmbeddedDocuments("Item", [item.toObject()]);
  }
}

function updateAction(itemUpdate, action, actorData) {
  // attack
  const isWeaponAttack = action.hit;
  if (isWeaponAttack) {
    itemUpdate.type = "weapon";
    itemUpdate.data.weaponType = "natural";
    itemUpdate.data.ability =
      parseInt(actorData.attributes.str.mod) +
        parseInt(actorData.proficiencyBonus.profBonus) ===
      parseInt(action.hit)
        ? "str"
        : "dex";
    itemUpdate.data.identified = true;
    itemUpdate.data.equipped = true;
    itemUpdate.data.proficient = true;
  }

  // damage
  if (!itemUpdate.data.damage) {
    itemUpdate.data.damage = {};
  }
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
  itemUpdate.data.damage.parts = parts;

  // versatile
  const versatile = action.versatile;
  if (versatile) {
    itemUpdate.data.damage.versatile = versatile.dmgroll; // todo use formula + @mod ?
    itemUpdate.data.properties.ver = true;
  }

  // reach
  const reach = action.reach;
  if (reach) {
    if (!itemUpdate.data.reach) {
      itemUpdate.data.reach = {};
    }
    itemUpdate.data.reach.value = reach;
    itemUpdate.data.reach.units = "ft";
    itemUpdate.data.actionType = "mwak";

    // melee attack
    if (isWeaponAttack) {
      if (!itemUpdate.data.range) {
        itemUpdate.data.range = {};
      }
      itemUpdate.data.range.value = `${reach} Feet`;
    }
  }

  // range
  if (!itemUpdate.data.range) {
    itemUpdate.data.range = {};
  }
  const range = action.range;
  if (range) {
    itemUpdate.data.range.value = range.normal;
    itemUpdate.data.range.long = range.far;
    itemUpdate.data.actionType = "rwak";
    itemUpdate.data.ability = "dex"; // todo always dex?
  }

  // shape
  const shape = action.shape;
  if (shape) {
    if (!itemUpdate.data.target) {
      itemUpdate.data.target = {};
    }
    itemUpdate.data.target.value = parseInt(shape.range);
    itemUpdate.data.target.type = shape.shape;
    itemUpdate.data.target.units = "ft";
  }

  // saves
  const save = action.savingThrow;
  if (save) {
    if (!itemUpdate.data.save) {
      itemUpdate.data.save = {};
    }
    itemUpdate.data.actionType = "save";
    itemUpdate.data.save.ability = shortenAbility(save.ability);
    itemUpdate.data.save.dc = save.dc;
    itemUpdate.data.save.scaling = "flat";
  }

  // recharge
  const recharge = action.recharge;
  if (recharge) {
    if (!itemUpdate.data.recharge) {
      itemUpdate.data.recharge = {};
    }
    itemUpdate.data.recharge.value = recharge.from;
    itemUpdate.data.recharge.charged = true;
  }

  return itemUpdate;
}

async function updateActions(actor, actorData) {
  for (const action of actorData.actions) {
    const name = action.name;
    if (!name) {
      return;
    }

    const lowerName = name.toLocaleLowerCase();

    let itemUpdate = {
      name,
      type: "feat",
      img: await retrieveFromPackItemImg(lowerName),
      data: {
        description: {
          value: action.desc,
        },
        activation: {
          type: "action",
          cost: 1,
        },
      },
    };

    if (lowerName !== "multiattack") {
      itemUpdate.data.quantity = 1;

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
  const legendaryResourcesUpdate = {
    "data.resources.legact.value": uses,
    "data.resources.legact.max": uses,
  };
  await actor.update(legendaryResourcesUpdate);

  for (const legAction of legendaryActions.actions) {
    const itemUpdate = {
      name: legAction.name,
      type: "feat",
      flags: {
        adnd5e: {
          itemInfo: {
            type: "legendary",
          },
        },
      },
      data: {
        activation: {
          type: "legendary",
          cost: legAction.cost,
        },
        consume: {
          type: "attribute",
          target: "resources.legact.value",
          amount: legAction.cost,
        },
        description: {
          value: legAction.desc,
        },
        equipped: true,
        proficient: true,
      },
    };

    const doc = new Item(itemUpdate).toObject();
    await actor.createEmbeddedDocuments("Item", [doc]);
  }
}

function setSenses(updateData, senses) {
  for (const s of senses) {
    logger.logConsole("s", s);
    updateData[`data.attributes.senses.${s.sense}`] = s.mod;
  }
  return updateData;
}

function formatSpeeds(speed) {
  const speeds = {};
  speed.forEach((s) => {
    speeds[s.type] = s.value;
  });
  return speeds;
}

function formatArmor(armor) {
  if (!armor.armorType) {
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
  const sizeData = race.size.trim().toLocaleLowerCase();
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
