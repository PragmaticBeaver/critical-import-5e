# critical-import-5e

FoundryVTT import module for monsters, NPCs, items, spells, and more.

## Usage

### Import Actor

1. Open up the `Actors tab`.
   ![FoundryVTT Actors tag](/docs/doc_actor_01.png)

2. Click on the `import Actor` button at the bottom.
   ![Critical Import 5e import dialog](/docs/doc_actor_02.png)

3. Open `D&D Beyond` inside your browser of choice and navigate to a creature of your choosing.
   ![D&D Beyond Bandit Captain](/docs/doc_actor_03.png)

4. Copy the content of the `monster statblock` as shown. Do not copy the description or anything outside the main statblock (the yellow colored container) or the plugin might not work correctly.
   ![Copy creature](/docs/doc_actor_04.png)

5. Paste the copied monster statblock inside the `Critical Import dialog` and press the `Import` button.
   ![Paste creature](/docs/doc_actor_05.png)

6. You should find a new actor inside the `Actors tab` whose name matches the name of the imported creature.
   ![New actor](/docs/doc_actor_06.png)

7. The `actor sheet` should be filled with its corresponding stats.
   ![Actor sheet](/docs/doc_actor_07.png)

### Import Spell

1. Open up the `Items tab`.
   ![FoundryVTT Items tab](/docs/doc_spell_01.png)

2. Click on the `import spell` button at the bottom.
   ![Critical Import 5e import dialog](/docs/doc_spell_02.png)

3. Open `D&D Beyond` inside your browser of choice and navigate to a spell of your choosing.
   ![D&D Beyond Fireball spell](/docs/doc_spell_03.png)

4. Copy the content of the `spell statblock` as shown. Do not copy the tags or anything outside the main statblock as it might interfere with the import.
   ![Copy spell](/docs/doc_spell_04.png)

5. Paste the copied spell stateblock inside the `Critical Import dialog` and press the `Import` button.
   ![Paste spell](/docs/doc_spell_05.png)

6. You should find a new spell (item) inside the `Items tab` whose name matches the name of the imported Spell.
   ![New spell](/docs/doc_spell_06.png)

7. The `spell sheet` should be filled with its corresponding stats.
   ![Spell sheet](/docs/doc_spell_07.png)

## Development

This project uses `pnpm` package manager.

### Development environment

For a simple development environment add a symlink from the "dist/PROJECT_NAME" directory of this repository into your FoundryVTT modules dir.

#### MacOS example

```bash
ln -s ~/src/critical-import-5e/dist/critical-import-5e/ /Users/Beaver/Library/Application\ Support/FoundryVTT/Data/modules
```

### Build project

To build the project execute `pnpm run build` or for a distribution build `pnpm run build-dist`.
