![](https://img.shields.io/badge/Foundry-v13-informational)
![Latest Release Download Count](https://img.shields.io/github/downloads/mhilbrunner/swade-sundries/latest/module.zip)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fswade-sundries&colorB=4aa94a)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

# SWADE Sundries

Small box of FoundryVTT [SWADE](https://foundryvtt.com/packages/swade/) system bits and bobs.
Each feature can be disabled as needed.

## Gear tab inventory improvements

### Custom item sections

Items can be assigned a custom section. If set on an item, it gets displayed under that section in the gear tab.
Inspired by the 5E [Custom Character Sheet Sections](https://foundryvtt.com/packages/custom-character-sheet-sections) module.

### Inventory sort

Adds a button to the top of the gear tab to sort the inventory alphabetically.

### Inventory search

Adds a search filter field to the top of the gear tab.

### Hide items

A list of items to hide can be set in module settings. Items with matching SWIDs will be hidden from the inventory tab for players.

## Roll Reminders

Reminders allow Active Effects to add custom text to the roll dialog depending on roll type,
heavily inspired by nifty modules like [Advantage Reminder](https://foundryvtt.com/packages/adv-reminder).
This is useful to set reminders based on player (or NPCs) features, like something granting a free reroll in some circumstances.

Below is a list of supported keys and when they are displayed. All begin with `flags.swade-sundries.r.` and all values
must be Strings containing valid plain text or HTML content set to `ADD`.

| Active Effect Key | Description
| --- | ---
| `flags.swade-sundries.r.all` | All rolls
| `flags.swade-sundries.r.item.xyz` | All rolls originating from XYZ item
| `flags.swade-sundries.r.trait` | All trait rolls
| `flags.swade-sundries.r.attribute` | All attribute rolls
| `flags.swade-sundries.r.attributep` | Physical attribute rolls (agility, strength or vigor)
| `flags.swade-sundries.r.attributem` | Mental attribute rolls (smarts or spirit)
| `flags.swade-sundries.r.agi` | Agility attribute rolls
| `flags.swade-sundries.r.sma` | Smarts attribute rolls
| `flags.swade-sundries.r.spi` | Spirit attribute rolls
| `flags.swade-sundries.r.str` | Strength attribute rolls
| `flags.swade-sundries.r.vig` | Vigor attribute rolls
| `flags.swade-sundries.r.skillall` | All skill rolls
| `flags.swade-sundries.r.skillp` | All physical skill rolls (linked to agility, strength or vigor)
| `flags.swade-sundries.r.skillm` | All mental skill rolls (linked to smarts or spirit)
| `flags.swade-sundries.r.skillattack` | Skill rolls with fighting/shooting/athletics
| `flags.swade-sundries.r.skillunarmed` | As above, but only for unarmed or natural weapon items
| `flags.swade-sundries.r.skillranged` | Skill rolls with shooting/athletics
| `flags.swade-sundries.r.skillarcane` | Skill rolls with arcane skills
| `flags.swade-sundries.r.skillagi` | Skill rolls linked to agility
| `flags.swade-sundries.r.skillsma` | Skill rolls linked to smarts
| `flags.swade-sundries.r.skillspi` | Skill rolls linked to spirit
| `flags.swade-sundries.r.skillstr` | Skill rolls linked to strength
| `flags.swade-sundries.r.skillvig` | Skill rolls linked to vigor
| `flags.swade-sundries.r.skill.xyz` | Skill rolls for skill XYZ
| `flags.swade-sundries.r.damageall` | All damage rolls
| `flags.swade-sundries.r.damageweapon` | Damage rolls originating from a weapon item
| `flags.swade-sundries.r.damagemelee` | Damage rolls originating from a melee weapon item
| `flags.swade-sundries.r.damageranged` | Damage rolls originating from a non-melee weapon item
| `flags.swade-sundries.r.damagepower` | Damage rolls originating from a power item
| `flags.swade-sundries.r.damageunarmed` | Damage rolls for unarmed or natural weapon items
| `flags.swade-sundries.r.damage.xyz` | Damage rolls originating from XYZ item
| `flags.swade-sundries.r.running` | Running rolls
| `flags.swade-sundries.r.save.shaken` | Rolls against shaken
| `flags.swade-sundries.r.save.stunned` | Rolls against stunned
| `flags.swade-sundries.r.save.bleedingout` | Rolls against bleeding out
| `flags.swade-sundries.r.save.soak` | Rolls to soak

For now, only Active Effects modifying these keys are considered, modifying these flags in any other way won't have any effect.
Disabled effects and empty strings will be filtered out.

## Installation

Use Foundry's packager manager or use this URL with its install from manifest URL feature:

<https://github.com/mhilbrunner/swade-sundries/releases/latest/download/module.json>

If you want to install a specific release, browse the available versions for links to version-specific `module.json` files:

<https://github.com/mhilbrunner/swade-sundries/releases>

## Legal and License

This module is licensed under the terms of the MIT license, see [LICENSE](LICENSE).

This module is unnoficial and not endorsed by Pinnacle. Savage Worlds and all associated logos and trademarks are copyrights of [Pinnacle Entertainment Group](https://peginc.com).

Regarding Foundry, this is a work under the Limited License Agreement for Package Development, as outlined [here](https://foundryvtt.com/article/license/).
