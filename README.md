![](https://img.shields.io/badge/Foundry-v13-informational)
![Latest Release Download Count](https://img.shields.io/github/downloads/mhilbrunner/tokenprofile/latest/module.zip)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Ftokenprofile&colorB=4aa94a)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# SWADE Sundries

WIP. For now this only has the roll reminders feature.

## Reminders

This feature allows Active Effects to add custom text to the roll dialog depending on the type of the roll.
This is useful to set reminders based on player (or NPCs) features, like something granting a free reroll in some circumstances.

This is a list of supported keys and when they are displayed. All begin with `flags.swade-sundries.r.`, and all must be Strings set to `ADD`.

| Active Effect Key | Description
| --- | ---
| `flags.swade-sundries.r.all` | All rolls

## Installation

Use Foundry's packager manager or use this URL with its install from manifest URL feature:

<https://github.com/mhilbrunner/swade-sundries/releases/latest/download/module.json>

If you want to install a specific release, browse the available versions for links to version-specific `module.json` files:

<https://github.com/mhilbrunner/swade-sundries/releases>

## License

The code is licensed under the terms of the MIT license, see [LICENSE](LICENSE).
Regarding Foundry, this is a work under the Limited License Agreement for Package Development, as outlined [here](https://foundryvtt.com/article/license/).
