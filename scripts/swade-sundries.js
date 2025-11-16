class SWADESundriesUtil {
    static stringToHTML(str) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(str, 'text/html');
        return doc.body.firstElementChild;
    }

    static trimSuffix(str, suffix) {
        return str.endsWith(suffix) ? str.slice(0, -suffix.length) : str
    }

    static sortedKeys(objWithStrKeys) {
        if (!objWithStrKeys) return objWithStrKeys;
        const collator = new Intl.Collator(game.settings.get("core", "language"), { numeric: true, sensitivity: "base" });
        return Object.keys(objWithStrKeys)?.sort(collator.compare);
    }

    static preventSubmit(element) {
        if (!element) return;
        const p = function (event) {
            if (event?.keyCode === 13) {
                event?.preventDefault();
                event?.stopPropagation();
                return false;
            }
        }
        element.addEventListener('keypress', p);
        element.addEventListener('keydown', p);
        element.addEventListener('keyup', p);
    }

    static localizeSlug(s) {
        if (!s) return s;
        return game.swade.util.slugify(game.i18n.localize(s));
    }

    static isAttr(s, attr) {
        if (!s?.length) return false;
        if (!attr?.length) return false;
        s = s.trim().toLowerCase();
        attr = attr.trim().toLowerCase();
        if (attr === 'agility') {
            return s === attr || s === SWADESundriesUtil.localizeSlug('SWADE.AttrAgi');
        }
        if (attr === 'smarts') {
            return s === attr || s === SWADESundriesUtil.localizeSlug('SWADE.AttrSma');
        }
        if (attr === 'spirit') {
            return s === attr || s === SWADESundriesUtil.localizeSlug('SWADE.AttrSpr');
        }
        if (attr === 'strength') {
            return s === attr || s === SWADESundriesUtil.localizeSlug('SWADE.AttrStr');
        }
        if (attr === 'vigor') {
            return s === attr || s === SWADESundriesUtil.localizeSlug('SWADE.AttrVig');
        }
        return false;
    }

    static async openSheet(uuid) {
        const doc = await fromUuid(uuid);
        if (!doc) {
            console.log(SWADESundries.MOD_ID, `Doc missing, can't open sheet for ${uuid}`);
            return;
        };
        doc.sheet?.render(true);
    }
}

class SWADESundriesReminders {
    isDamageItem(item) {
        if (item?.system?.damage?.length) return true;
        if (item?.system?.actions?.additional) {
            for (const key of Object.keys(item?.system?.actions?.additional)) {
                const action = item?.system?.actions?.additional[key];
                if (action?.type === 'damage') return true;
            }
        }

        return false;
    }

    isAttackSkill(swid) {
        if (!swid?.length) return false;
        swid = game.swade.util.slugify(swid);
        return swid === 'fighting' || swid === 'shooting' || swid === 'athletics';
    }

    isRangedSkill(swid) {
        if (!swid?.length) return false;
        swid = game.swade.util.slugify(swid);
        return swid === 'shooting' || swid === 'athletics';
    }

    isUnarmed(item) {
        if (!item) return false;
        return SWADESundries.api.reminders.isItemNameMatch(item, 'Unarmed') || item?.system?.swid.startsWith('natural');
    }

    isArcaneSkill(actor, item) {
        if (!actor || !item || item.type !== 'skill') return false;

        const arcanes = actor.items?.filter((i) => i.type === 'power' && i.system?.arcane?.length).map((i) => i.system.arcane);
        for (const a of arcanes) {
            if (item.name === a || item.system?.swid === game.swade.util.slugify(a)) return true;
        }

        return false;
    }

    isItemNameMatch(item, nameOrSWID) {
        if (!item || !nameOrSWID?.length) return false;
        return item.name === nameOrSWID ||
            game.swade.util.slugify(item.name) === game.swade.util.slugify(nameOrSWID) ||
            item.system?.swid === game.swade.util.slugify(nameOrSWID);
    }

    findFirstMatchingItem(actor, nameOrSWID, type) {
        if (!actor?.items?.size || !nameOrSWID?.length) return undefined;

        if (type === 'damage') {
            for (const i of actor.items) {
                if (!SWADESundries.api.reminders.isDamageItem(i)) continue;
                if (SWADESundries.api.reminders.isItemNameMatch(i, nameOrSWID)) return i;
            }
        } else if (type === 'skill') {
            for (const i of actor.items) {
                if (i.type !== 'skill') continue;
                if (SWADESundries.api.reminders.isItemNameMatch(i, nameOrSWID)) return i;
            }
        }

        return undefined;
    }

    parseTraitRoll(ret) {
        if (!ret) return ret;

        let suffix = ' ' + game.i18n.localize('SWADE.SkillTest');
        if (ret.title?.endsWith(suffix)) {
            ret.type = 'skill';
            ret.name = SWADESundriesUtil.trimSuffix(ret.title, suffix);
            return ret;
        }

        suffix = ' ' + game.i18n.localize('SWADE.AttributeTest');
        if (ret.title?.endsWith(suffix)) {
            ret.type = 'attribute';
            ret.name = SWADESundriesUtil.trimSuffix(ret.title, suffix);
            return ret;
        }

        if (ret.title === game.i18n.localize('SWADE.EffectCallbacks.Shaken.Flavor')) {
            ret.type = 'attribute';
            ret.name = 'spirit';
            ret.againstShaken = true;
            return ret;
        } else if (ret.title === game.i18n.localize('SWADE.EffectCallbacks.Stunned.Title')) {
            ret.type = 'attribute';
            ret.name = 'vigor';
            ret.againstStunned = true;
            return ret;
        } else if (ret.title === game.i18n.localize('SWADE.EffectCallbacks.BleedingOut.Title')) {
            ret.type = 'attribute';
            ret.name = 'vigor';
            ret.againstBleedingOut = true;
            return ret;
        } else if (ret.title === game.i18n.localize('SWADE.DamageApplicator.SoakDialog.SoakRoll')) {
            ret.type = 'attribute';
            ret.name = 'vigor';
            ret.soak = true;
            return ret;
        }

        for (const die of ret.roll?.dice) {
            if (!die?.flavor?.length || die.flavor === 'Wild Die' || die.flavor === game.i18n.localize('SWADE.WildDie')) continue;
            const f = game.swade.util.slugify(die.flavor);

            if (f === 'agility' || f === 'agi' ||
                f === game.swade.util.slugify(game.i18n.localize('SWADE.AttrAgi')) ||
                f === game.swade.util.slugify(game.i18n.localize('SWADE.AttrAgiShort'))
            ) {
                ret.type = 'attribute';
                ret.name = 'agility';
                return ret;
            }

            if (f === 'smarts' || f === 'sma' ||
                f === game.swade.util.slugify(game.i18n.localize('SWADE.AttrSma')) ||
                f === game.swade.util.slugify(game.i18n.localize('SWADE.AttrSmaShort'))
            ) {
                ret.type = 'attribute';
                ret.name = 'smarts';
                return ret;
            }

            if (f === 'spirit' || f === 'spr' ||
                f === game.swade.util.slugify(game.i18n.localize('SWADE.AttrSpr')) ||
                f === game.swade.util.slugify(game.i18n.localize('SWADE.AttrSprShort'))
            ) {
                ret.type = 'attribute';
                ret.name = 'spirit';
                return ret;
            }

            if (f === 'strength' || f === 'str' ||
                f === game.swade.util.slugify(game.i18n.localize('SWADE.AttrStr')) ||
                f === game.swade.util.slugify(game.i18n.localize('SWADE.AttrStrShort'))
            ) {
                ret.type = 'attribute';
                ret.name = 'strength';
                return ret;
            }

            if (f === 'vigor' || f === 'vig' ||
                f === game.swade.util.slugify(game.i18n.localize('SWADE.AttrVig')) ||
                f === game.swade.util.slugify(game.i18n.localize('SWADE.AttrVigShort'))
            ) {
                ret.type = 'attribute';
                ret.name = 'vigor';
                return ret;
            }

            ret.type = 'skill';
            ret.name = die.flavor;
        }

        console.log(SWADESundries.MOD_ID, 'Unhandled trait roll for reminders:', roll.rollType);
        return ret;
    }

    parseRollInfo(actor, item, roll, title) {
        let ret = {
            actor: actor,
            roll: roll,
            title: title,
            item: item,
            type: undefined,
            name: undefined,
        }

        if (!ret.actor) ret.actor = ret.item?.actor;
        if (!ret.actor || !ret.roll) return ret;

        if (roll.rollType === 'damage') {
            ret.type = 'damage';
            const suffix = ' ' + game.i18n.localize('SWADE.Dmg');
            if (title.endsWith(suffix)) {
                ret.name = SWADESundriesUtil.trimSuffix(title, suffix);
            }
        } else if (roll.rollType === 'trait') {
            ret = SWADESundries.api.reminders.parseTraitRoll(ret);
        } else if (roll.rollType === 'running') {
            ret.type = 'running';
        } else  {
            console.log(SWADESundries.MOD_ID, 'Unhandled roll type for reminders:', roll.rollType);
        }

        if (!ret.item) {
            ret.item = SWADESundries.api.reminders.findFirstMatchingItem(ret.actor, ret.name, ret.type);
        }

        if (ret.type === 'skill') {
            if (ret.item?.type === 'skill') ret.skillItem = ret.item;
            if (!ret.skillItem) ret.skillItem = SWADESundries.api.reminders.findFirstMatchingItem(ret.actor, ret.name, 'skill');
        }

        return ret;
    }

    checkReminderApplies(reminder, rollInfo) {
        if (!reminder || reminder.key?.length, !reminder.text?.length, !rollInfo) return false;
        const nameSWID = rollInfo.name?.length ? game.swade.util.slugify(rollInfo.name) : '';
        const lastPart = reminder.key?.length ? reminder.key?.split('.').pop() : '';

        // General
        if (reminder.key === 'all') return true;
        if (reminder.key === 'trait' && rollInfo.roll?.rollType === 'trait') return true;
        if (reminder.key === 'running' && rollInfo.type === 'running') return true;
        if (reminder.key === 'save.shaken' && rollInfo.againstShaken) return true;
        if (reminder.key === 'save.stunned' && rollInfo.againstStunned) return true;
        if (reminder.key === 'save.bleedingout' && rollInfo.againstBleedingOut) return true;
        if (reminder.key === 'save.soak' && rollInfo.soak) return true;
        if (reminder.key.startsWith('item.') && SWADESundries.api.reminders.isItemNameMatch(rollInfo.item, lastPart)) return true;

        // Attributes
        if (reminder.key === 'attribute' && rollInfo.type === 'attribute') return true;
        if (reminder.key === 'attributep' && rollInfo.type === 'attribute' &&
            (SWADESundriesUtil.isAttr(nameSWID, 'agility') ||
             SWADESundriesUtil.isAttr(nameSWID, 'strength') ||
             SWADESundriesUtil.isAttr(nameSWID, 'vigor'))) return true;
        if (reminder.key === 'attributem' && rollInfo.type === 'attribute' &&
            (SWADESundriesUtil.isAttr(nameSWID, 'smarts') || SWADESundriesUtil.isAttr(nameSWID, 'spirit'))) return true;
        if (reminder.key === 'agi' && rollInfo.type === 'attribute' && SWADESundriesUtil.isAttr(nameSWID, 'agility')) return true;
        if (reminder.key === 'sma' && rollInfo.type === 'attribute' && SWADESundriesUtil.isAttr(nameSWID, 'smarts')) return true;
        if (reminder.key === 'spr' && rollInfo.type === 'attribute' && SWADESundriesUtil.isAttr(nameSWID, 'spirit')) return true;
        if (reminder.key === 'spi' && rollInfo.type === 'attribute' && SWADESundriesUtil.isAttr(nameSWID, 'spirit')) return true;
        if (reminder.key === 'str' && rollInfo.type === 'attribute' && SWADESundriesUtil.isAttr(nameSWID, 'strength')) return true;
        if (reminder.key === 'vig' && rollInfo.type === 'attribute' && SWADESundriesUtil.isAttr(nameSWID, 'vigor')) return true;

        // Skills
        if (reminder.key === 'skillall' && rollInfo.type === 'skill') return true;
        if (reminder.key === 'skillattack' && rollInfo.type === 'skill' && SWADESundries.api.reminders.isAttackSkill(rollInfo.skillItem?.system?.swid)) return true;
        if (reminder.key === 'skillranged' && rollInfo.type === 'skill' && SWADESundries.api.reminders.isRangedSkill(rollInfo.skillItem?.system?.swid)) return true;
        if (reminder.key === 'skillunarmed' && rollInfo.type === 'skill' && SWADESundries.api.reminders.isUnarmed(rollInfo.item) && SWADESundries.api.reminders.isAttackSkill(rollInfo.skillItem?.system?.swid)) return true;
        if (reminder.key === 'skillarcane' && rollInfo.type === 'skill' && SWADESundries.api.reminders.isArcaneSkill(rollInfo.actor, rollInfo.skillItem)) return true;
        if (reminder.key === 'skillagi' && rollInfo.type === 'skill' && rollInfo.item?.system?.attribute === 'agility') return true;
        if (reminder.key === 'skillsma' && rollInfo.type === 'skill' && rollInfo.item?.system?.attribute === 'smarts') return true;
        if (reminder.key === 'skillspr' && rollInfo.type === 'skill' && rollInfo.item?.system?.attribute === 'spirit') return true;
        if (reminder.key === 'skillspi' && rollInfo.type === 'skill' && rollInfo.item?.system?.attribute === 'spirit') return true;
        if (reminder.key === 'skillstr' && rollInfo.type === 'skill' && rollInfo.item?.system?.attribute === 'strength') return true;
        if (reminder.key === 'skillvig' && rollInfo.type === 'skill' && rollInfo.item?.system?.attribute === 'vigor') return true;
        if (reminder.key === 'skillp' && rollInfo.type === 'skill' &&
            (rollInfo.skillItem?.system?.attribute === 'agility' || rollInfo.skillItem?.system?.attribute === 'strength' || rollInfo.skillItem?.system?.attribute === 'vigor')) return true;
        if (reminder.key === 'skillm' && rollInfo.type === 'skill' &&
            (rollInfo.skillItem?.system?.attribute === 'smarts' || rollInfo.skillItem?.system?.attribute === 'spirit')) return true;
        if (reminder.key.startsWith('skill.') && rollInfo.type === 'skill' && SWADESundries.api.reminders.isItemNameMatch(rollInfo.skillItem, lastPart)) return true;

        // Damage
        if (reminder.key === 'damageall' && rollInfo.type === 'damage') return true;
        if (reminder.key === 'damageweapon' && rollInfo.type === 'damage' && rollInfo.item?.type === 'weapon') return true;
        if (reminder.key === 'damagemelee' && rollInfo.type === 'damage' && rollInfo.item?.type === 'weapon' && rollInfo.item?.system?.rangeType === 0) return true;
        if (reminder.key === 'damageranged' && rollInfo.type === 'damage' && rollInfo.item?.type === 'weapon' && rollInfo.item?.system?.rangeType !== 0) return true;
        if (reminder.key === 'damagepower' && rollInfo.type === 'damage' && rollInfo.item?.type === 'power') return true;
        if (reminder.key === 'damageunarmed' && rollInfo.type === 'damage' && SWADESundries.api.reminders.isUnarmed(rollInfo.item)) return true;
        if (reminder.key.startsWith('damage.') && rollInfo.type === 'damage' && SWADESundries.api.reminders.isItemNameMatch(rollInfo.item, lastPart)) return true;

        return false;
    }

    getReminders(actor) {
        let dedup = {};

        let reminders = [];
        if (!actor) return reminders;

        for (const ae of actor.appliedEffects) {
            if (ae.disabled) continue;
            for (const c of ae.changes) {
                if (typeof c.value !== 'string' && !(c.value instanceof String)) continue;
                if (!c.value || !c.value.length) continue;
                if (c.mode !== 2) continue; // For now, only ADD supported.
                if (!c.key.startsWith(SWADESundries.MOD_KEY_REMINDER_PREFIX)) continue;
                const k = c.key.slice(SWADESundries.MOD_KEY_REMINDER_PREFIX.length);
                const dedupKey = k + c.value.trim().toLowerCase();
                if (dedup.hasOwnProperty(dedupKey)) {
                    // TODO: Maybe look up the existing reminder here and also note this additional source?
                    continue;
                }
                dedup[dedupKey] = true;

                reminders.push({
                    key: k,
                    text: c.value,
                    sources: [ae],
                });
            }
        }

        return reminders;
    }

    async handleRollReminders(app, html, context, options) {
        if (!game.settings.get(SWADESundries.MOD_ID, 'reminders.enabled')) return;

        let item = app?.ctx?.item;
        let actor = app?.ctx?.actor;
        if (!actor) actor = item?.actor;
        if (!actor) return;
        const reminders = SWADESundries.api.reminders.getReminders(actor);
        if (!reminders?.length) return;
        const roll = app?.ctx?.roll;
        if (!roll) return;
        const title = app?.ctx?.title;

        const rollInfo = SWADESundries.api.reminders.parseRollInfo(actor, item, roll, title);
        let reminderContent = '';
        let reminderContentFull = '';
        for (const reminder of reminders) {
            if (SWADESundries.api.reminders.checkReminderApplies(reminder, rollInfo)) {
                if (reminderContent.length) reminderContent += ' ';
                reminderContent += reminder.text;
                let sources = '';
                for (const s of reminder.sources) {
                    if (!s.name?.length) continue;
                    if (sources.length) sources += ', ';
                    sources += `<strong>${s.name}</strong>`;
                    if (s.parent?.name?.length) sources += ` (<strong>${s.parent?.name}</strong>)`;
                }
                reminderContentFull += `<p class='reminder-text'>${reminder.text}<span class='reminder-source'> – ${sources}</span></p>`;
            }
        }

        const TextEditor = foundry.applications.ux.TextEditor.implementation;
        const maxLen = SWADESundries.getSetting('reminders.maxlen');
        if (maxLen <= 0) reminderContent = '';
        if (maxLen > 0) reminderContent = TextEditor.truncateText(reminderContent, { maxLength: maxLen, splitWords: false, suffix: '…'});

        const insertAfter = app?.element?.querySelector('fieldset.formula');
        if (!insertAfter) return;

        reminderContent = await TextEditor.enrichHTML(reminderContent);
        reminderContentFull = await TextEditor.enrichHTML(reminderContentFull);
        if (reminderContentFull) reminderContentFull = foundry.utils.escapeHTML(reminderContentFull);
        let template = `
            <div class='${SWADESundries.MOD_ID} reminders'
               data-tooltip='${reminderContentFull}' data-tooltip-direction='UP'>
               <p>${reminderContent}</p>
            </div>
        `;

        insertAfter.after(SWADESundriesUtil.stringToHTML(template));
    }

    register() {
        game.settings.register(SWADESundries.MOD_ID, 'reminders.enabled', {
            name: `${SWADESundries.MOD_ID}.settings.reminders.enabled.name`,
            hint: `${SWADESundries.MOD_ID}.settings.reminders.enabled.hint`,
            config: true,
            default: true,
            scope: 'world',
            type: Boolean,
        });

        game.settings.register(SWADESundries.MOD_ID, 'reminders.maxlen', {
            name: `${SWADESundries.MOD_ID}.settings.reminders.maxlen.name`,
            hint: `${SWADESundries.MOD_ID}.settings.reminders.maxlen.hint`,
            config: true,
            default: 133,
            scope: 'client',
            type: Number,
        });

        Hooks.on(`renderRollDialog`, SWADESundries.api.reminders.handleRollReminders);
    }
}

class SWADESundriesInventory {
    static KEY_INVSEC = 'invsec';
    static INV_ITEM_TYPES = ['weapon', 'armor', 'shield', 'consumable', 'gear'];

    getSection(item) {
        return item?.getFlag(SWADESundries.MOD_ID, SWADESundriesInventory.KEY_INVSEC)?.trim();
    }

    formatForSection(itemElement) {
        if (!itemElement) return itemElement;

        const toRemove = itemElement.querySelectorAll('.bonus, .damage, .ap, .min-str, .parry, .cover');
        toRemove?.forEach((e) => {
            if (e.matches('summary > span')) e.remove();
        });

        const weight = itemElement.querySelector('.weight');
        if (!weight) return itemElement;

        const charges = itemElement.querySelector('.charges');
        const note = itemElement.querySelector('.note');
        if (!charges) {
            const s = document.createElement('span');
            s.classList = `charges`;
            if (note) {
                note.insertAdjacentElement('beforebegin', s);
            } else {
                weight.insertAdjacentElement('beforebegin', s);
            }
        }

        if (!note) {
            const s = document.createElement('span');
            s.classList = `note`;
            weight.insertAdjacentElement('beforebegin', s);
        }

        return itemElement;
    }

    sectionsEnabled() {
        return SWADESundries.getSetting('invsec.enabled') && SWADESundries.getSetting('invsec.enabledclient');
    }

    getSortItemUpdates(items) {
        if (!items?.length || items.length < 2) return [];

        const STEP_SIZE = 100000;
        const collator = new Intl.Collator(game.settings.get("core", "language"), { numeric: true, sensitivity: "base" });

        let updates = items.sort((a, b) => {
            return collator.compare(a.name, b.name);
        }).flatMap(function (item, i) {
            const newSort = STEP_SIZE + i * STEP_SIZE;
            if (item.sort === newSort) {
                return [];
            }
            return [{ _id: item.id, sort: newSort }];
        });
        return updates;
    }

    async sortInventory(actorId) {
        if (!actorId?.length) return;
        const actor = game.actors.get(actorId);
        if (!actor || !actor.isOwner) return;

        const TYPES_TO_SORT = ['weapon', 'armor', 'shield', 'gear', 'consumable'];
        const sections = {};
        let updates = [];
        for (let [itemType, items] of Object.entries(actor.itemTypes)) {
            if (!TYPES_TO_SORT.includes(itemType)) continue;

            if (!SWADESundries.api.inventory.sectionsEnabled()) {
                updates = updates.concat(SWADESundries.api.inventory.getSortItemUpdates(items));
                continue;
            }

            // With sections enabled, we need to sort items with sections inside their own sections.
            let noSection = [];
            for (const item of items) {
                const section = SWADESundries.api.inventory.getSection(item);
                if (section?.length) {
                    if (sections.hasOwnProperty(section)) {
                        sections[section].push(item);
                    } else {
                        sections[section] = [item];
                    }
                } else {
                    noSection.push(item);
                }
            }

            updates = updates.concat(SWADESundries.api.inventory.getSortItemUpdates(noSection));
        }

        if (SWADESundries.api.inventory.sectionsEnabled()) {
            for (const [section, items] of Object.entries(sections)) {
                updates = updates.concat(SWADESundries.api.inventory.getSortItemUpdates(items));
            }
        }

        if (!updates.length) {
            return;
        }
        return actor.updateEmbeddedDocuments("Item", updates);
    }

    searchFilterCallback(event, app, html) {
        if (!html) return;
        const actor = app?.object;
        if (!actor) return;

        const query = event?.target?.value?.trim()?.toLowerCase();
        const filter = query?.length && query?.length > 0;
        const filterClass = `${SWADESundries.MOD_ID}-filtered`;

        const inventory = html.querySelector('.sheet-body .tab.inventory .inventory');
        if (!inventory) return;
        if (filter) {
            inventory.classList.add(`${SWADESundries.MOD_ID}-filter-active`);
        } else {
            inventory.classList.remove(`${SWADESundries.MOD_ID}-filter-active`);
        }

        const items = inventory.querySelectorAll('& > ul > li');
        if (!items?.length) return;

        items.forEach((itemEl) => {
            if (!filter) {
                return itemEl.classList.remove(filterClass);
            }

            const id = itemEl?.dataset?.itemId;
            if (!id?.length) return;
            const item = actor.items?.get(id);
            if (!item) return;

            if (item.name?.toLowerCase().includes(query) ||
                item.system?.swid?.includes(query) ||
                item.system?.swid?.includes(game.swade.util.slugify(query))) {
                return itemEl.classList.remove(filterClass);
            }

            return itemEl.classList.add(filterClass);
        });
    }

    addInventoryMenu(app, html) {
        if (!html) return;
        const actor = app?.object;
        if (!actor) return;

        if (!SWADESundries.getSetting('invfilter.enabled') &&
            !SWADESundries.getSetting('invsort.enabled')) {
            return;
        }

        const topRow = html.querySelector('.sheet-body .tab.inventory > section.flexrow');
        if (!topRow) return;
        const buttons = document.createElement('div');
        buttons.className = `${SWADESundries.MOD_ID} inventory-menu`;

        const menu = topRow.insertAdjacentElement('beforeend', buttons);
        if (!menu) return;

        if (SWADESundries.getSetting('invfilter.enabled')) {
            const searchFilter = foundry.applications.fields.createTextInput({
                name: `${SWADESundries.MOD_ID}-filter`, value: ``,
                placeholder: game.i18n.localize(`${SWADESundries.MOD_ID}.inventory.filter.placeholder`),
                classes: 'search',
            });
            SWADESundriesUtil.preventSubmit(searchFilter);
            searchFilter.addEventListener('keydown', (event) => {
                if (event?.keyCode === 27) {
                    event.preventDefault();
                    event.stopPropagation();
                    const el = event?.target;
                    if (!el) return;
                    el.value = '';
                    el.blur();
                    SWADESundries.api.inventory.searchFilterCallback(undefined, app, html);
                }
            });
            searchFilter.addEventListener('input', (event) => {
                event?.stopPropagation();
                event?.preventDefault();
                SWADESundries.api.inventory.searchFilterCallback(event, app, html);
            });
            menu.appendChild(searchFilter);
        }

        if (SWADESundries.getSetting('invsort.enabled')) {
            const sort = document.createElement('button');
            sort.classList = 'sort';
            sort.innerHTML = `<i class="fa-solid fa-sort-alpha-down" ></i>`;
            sort.dataset['tooltip'] = `${SWADESundries.MOD_ID}.inventory.sort.tooltip`;
            sort.disabled = !actor.isOwner;
            sort.addEventListener('click', (event) => {
                SWADESundries.api.inventory.sortInventory(actor.id);
            });
            menu.appendChild(sort);
        }
    }

    renderCharacterSheet(app, html, context, options) {
        html = html instanceof jQuery ? html[0] : html;
        const actor = app?.object;
        if (!actor) return;

        SWADESundries.api.inventory.addInventoryMenu(app, html);
        
        const inventory = html?.querySelector('.sheet-body .tab.inventory .inventory');
        if (!inventory) return;

        const items = inventory.querySelectorAll('& > ul > li');
        if (!items?.length) return;

        let invhide = SWADESundries.getSetting('invhide.items')?.replace(';', ',')?.split(',');
        invhide = invhide && invhide.length ? invhide : [];
        const hide = SWADESundries.getSetting('invhide.enabled') && invhide.length;

        if (!SWADESundries.api.inventory.sectionsEnabled() && !hide) {
            return;
        }

        let sections = {};
        let hideClass = `${SWADESundries.MOD_ID}-player-hidden${game.user.isGM ? '-gm' : ''}`;
        items.forEach((itemEl) => {
            const id = itemEl?.dataset?.itemId;
            if (!id?.length) return;
            const item = actor.items?.get(id);
            if (!item) return;

            if (hide) {
                invhide.forEach((h) => {
                    h = h?.trim();
                    if (!h?.length) return;
                    if (!SWADESundries.api.reminders.isItemNameMatch(item, h)) return;

                    itemEl.classList.add(hideClass);
                });
            }

            if (!SWADESundries.api.inventory.sectionsEnabled()) return;
            const section = SWADESundries.api.inventory.getSection(item);

            if (section?.length) {
                if (sections.hasOwnProperty(section)) {
                    sections[section].push({item: item, element: itemEl});
                } else {
                    sections[section] = [{ item: item, element: itemEl }];
                }
                itemEl.remove();
            }
        });

        const headerMisc = inventory.querySelector('.header.misc')
        if (!headerMisc) return;
        for (const section of SWADESundriesUtil.sortedKeys(sections)) {
            const items = sections[section];
            const header = document.createElement('header');
            header.className = `header ${SWADESundries.MOD_ID} section`;
            header.innerHTML = `
                <span class="header-name">${foundry.utils.escapeHTML(section)}</span>
                <span class="charges">${game.i18n.localize('SWADE.Charges')}</span>
                <span class="note">${game.i18n.localize('SWADE.Notes')}</span>
                <span class="weight">${game.i18n.localize('SWADE.Weight')}</span>
            `;
            const insertedHeader = headerMisc.insertAdjacentElement('beforebegin', header);
            if (!insertedHeader) return;
            const list = document.createElement('ul');
            list.className = `${SWADESundries.MOD_ID} section-items`;
            const insertedList = headerMisc.insertAdjacentElement('beforebegin', list);
            if (!insertedList) return;
            for (const row of items.sort((a, b) => a.item?.sort - b.item?.sort)) {
                const e = SWADESundries.api.inventory.formatForSection(row.element);
                if (!e) continue;
                insertedList.appendChild(e);
            }
        }
    }

    renderItemSheet(app, html, context, options) {
        if (!SWADESundries.api.inventory.sectionsEnabled()) return;

        html = html instanceof jQuery ? html[0] : html;
        const item = app?.object;
        if (!item || !SWADESundriesInventory.INV_ITEM_TYPES.includes(item.type)) return;
        let target = html?.querySelector('.sheet-sidebar .additional-stats')?.previousElementSibling;
        if (!target) return;

        const section = SWADESundries.api.inventory.getSection(item);
        const sectionInputName = `flags.${SWADESundries.MOD_ID}.${SWADESundriesInventory.KEY_INVSEC}`;

        const sectionInput = foundry.applications.fields.createTextInput({
            name: sectionInputName, value: section, placeholder: game.i18n.localize(`${SWADESundries.MOD_ID}.inventory.section.placeholder`),
            dataset: { tooltip: `${SWADESundries.MOD_ID}.inventory.section.tooltip`}});
        const sectionGroup = foundry.applications.fields.createFormGroup({
            input: sectionInput, label: `${SWADESundries.MOD_ID}.inventory.section.label`, localize: true,
            classes: [SWADESundries.MOD_ID, 'section'],
        });
        target.insertAdjacentElement('beforebegin', sectionGroup);
    }

    register() {
        game.settings.register(SWADESundries.MOD_ID, 'invsort.enabled', {
            name: `${SWADESundries.MOD_ID}.settings.invsort.enabled.name`,
            hint: `${SWADESundries.MOD_ID}.settings.invsort.enabled.hint`,
            config: true,
            default: true,
            scope: 'world',
            type: Boolean,
        });

        game.settings.register(SWADESundries.MOD_ID, 'invfilter.enabled', {
            name: `${SWADESundries.MOD_ID}.settings.invfilter.enabled.name`,
            hint: `${SWADESundries.MOD_ID}.settings.invfilter.enabled.hint`,
            config: true,
            default: true,
            scope: 'world',
            type: Boolean,
        });

        game.settings.register(SWADESundries.MOD_ID, 'invsec.enabled', {
            name: `${SWADESundries.MOD_ID}.settings.invsec.enabled.name`,
            hint: `${SWADESundries.MOD_ID}.settings.invsec.enabled.hint`,
            config: true,
            default: true,
            scope: 'world',
            type: Boolean,
        });

        game.settings.register(SWADESundries.MOD_ID, 'invsec.enabledclient', {
            name: `${SWADESundries.MOD_ID}.settings.invsec.enabledclient.name`,
            hint: `${SWADESundries.MOD_ID}.settings.invsec.enabledclient.hint`,
            config: true,
            default: true,
            scope: 'client',
            type: Boolean,
        });

        game.settings.register(SWADESundries.MOD_ID, 'invhide.enabled', {
            name: `${SWADESundries.MOD_ID}.settings.invhide.enabled.name`,
            hint: `${SWADESundries.MOD_ID}.settings.invhide.enabled.hint`,
            config: true,
            default: true,
            scope: 'world',
            type: Boolean,
        });

        game.settings.register(SWADESundries.MOD_ID, 'invhide.items', {
            name: `${SWADESundries.MOD_ID}.settings.invhide.items.name`,
            hint: `${SWADESundries.MOD_ID}.settings.invhide.items.hint`,
            config: true,
            default: '',
            scope: 'world',
            type: String,
        });

        Hooks.on(`renderCharacterSheet`, SWADESundries.api.inventory.renderCharacterSheet);
        Hooks.on(`renderItemSheet`, SWADESundries.api.inventory.renderItemSheet);
    }
}

class SWADESundriesSCT {
    defaultOptions = {
        anchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
        direction: CONST.TEXT_ANCHOR_POINTS.TOP,
        fontSize: 28,
        fill: 0xFFFFFF,
        stroke: 0x000000,
        strokeThickness: 4,
        jitter: 0.33,
        sundriesSigned: false,
        sundriesTimes: 1,
        sundriesDistanceRel: 0.75,
        sundriesDelayMS: 800,
    };
    defaultColors = {
        positive: 0x00FF00,
        negative: 0xFF0000,
    };

    shouldShowSCT(actorOrToken) {
        if (!actorOrToken) return false;
        const actor = actorOrToken?.isToken && actorOrToken.actor ? actorOrToken.actor : actorOrToken;
        if (!actor) return false;
        if (actor.hasPlayerOwner && !SWADESundries.getSetting('sct.players')) return false;
        if (!actor.hasPlayerOwner && !SWADESundries.getSetting('sct.npcs')) return false;

        if (actorOrToken instanceof TokenDocument) {
            const token = actorOrToken;
            if (!token.object?.visible) return false;
            if (token.isSecret) return false;
            if (!token.rendered) return false;
            if (!token.parent?.isView) return false;
        }

        return true;
    }

    async create(actorOrToken, text, options = {}) {
        if (!actorOrToken || !text?.length) return;
        let tokens = [];
        if (actorOrToken instanceof String || typeof actorOrToken === 'string') {
            if (actorOrToken.includes('Actor.')) {
                const actor = await foundry.utils.fromUuid(actorOrToken);
                if (!actor) return;
                tokens = actor.getActiveTokens(true, true);
            } else {
                const t = await foundry.utils.fromUuid(actorOrToken);
                if (!t) return;
                tokens = [t];
            }
        } else if (actorOrToken.isToken) {
            tokens = [actorOrToken.token];
        } else if (actorOrToken instanceof TokenDocument) {
            tokens = [actorOrToken];
        } else {
            tokens = actorOrToken.getActiveTokens(true, true);
        }
        if (!tokens?.length) return;

        for (const token of tokens) {
            if (!SWADESundries.api.sct.shouldShowSCT(token)) return;
            const t = token.object;

            let o = foundry.utils.mergeObject(SWADESundries.api.sct.defaultOptions, options, { 'inplace': false });
            if (!o.distance && o.sundriesDistanceRel) {
                o.distance = (o.sundriesDistanceRel * t.h);
            }

            for (let count = 0; count < o.sundriesTimes; count++) {
                const delay = o.sundriesDelayMS === 0 ? 0 : (count) * Math.abs(o.sundriesDelayMS) + 1;
                setTimeout(() => {
                    canvas.interface.createScrollingText(t.center, text, o);
                }, delay);
            }
        }
    }

    async createPosOrNeg(actorOrToken, text, value, options = {}) {
        if (!actorOrToken || !text?.length) return;
        const o = foundry.utils.mergeObject({
            sundriesSigned: true,
            sundriesInvertColor: false,
        }, options, { 'inplace': false });
        let isNegative = !value || value <= 0;
        if (o.sundriesSigned) {
            if (!text?.trim()?.startsWith('+') && !text?.trim()?.startsWith('-')) text = isNegative ? `-${text}` : `+${text}`;
        }
        if (o.sundriesInvertColor) isNegative = !isNegative;
        if (isNegative) {
            return SWADESundries.api.sct.createNeg(actorOrToken, text, o);
        }
        return SWADESundries.api.sct.createPos(actorOrToken, text, o);
    }

    async createPos(actorOrToken, text, options = {}) {
        const o = foundry.utils.mergeObject({
            fill: SWADESundries.api.sct.defaultColors.positive,
        }, options, {'inplace': false});
        return SWADESundries.api.sct.create(actorOrToken, text, o);
    }

    async createNeg(actorOrToken, text, options = {}) {
        const o = foundry.utils.mergeObject({
            fill: SWADESundries.api.sct.defaultColors.negative,
        }, options, { 'inplace': false });
        return SWADESundries.api.sct.create(actorOrToken, text, o);
    }

    onUpdateActor(actor, changed, options, user) {
        if (!actor || !changed || options?.action !== 'update' || !options?.diff) return;
        if (!SWADESundries.api.sct.shouldShowSCT(actor)) return;

        const flatChanges = foundry.utils.flattenObject(changed);
        for (const [key, value] of Object.entries(flatChanges)) {
            if (key === 'system.details.conviction.active') {
                if (!SWADESundries.getSetting('sct.showconv')) continue;
                const conv = game.i18n.localize('SWADE.Conv');
                SWADESundries.api.sct.createPosOrNeg(actor, `(${conv})`, value);
            } else if (key === 'system.wounds.value') {
                if (!SWADESundries.getSetting('sct.showwounds')) continue;
                const diff = value - options?.swade?.wounds?.value;
                if (diff === 0) continue;
                const wound = game.i18n.localize('SWADE.Wound');
                SWADESundries.api.sct.createPosOrNeg(actor, wound, diff, {sundriesInvertColor: true, sundriesTimes: Math.abs(diff)});
            } else if (key === 'system.fatigue.value') {
                if (!SWADESundries.getSetting('sct.showfat')) continue;
                const diff = value - options?.swade?.fatigue?.value;
                if (diff === 0) continue;
                const fat = game.i18n.localize('SWADE.Fatigue');
                SWADESundries.api.sct.createPosOrNeg(actor, fat, diff, {sundriesInvertColor: true, sundriesTimes: Math.abs(diff)});
            }
        }
    }

    register() {
        game.settings.register(SWADESundries.MOD_ID, 'sct.players', {
            name: `${SWADESundries.MOD_ID}.settings.sct.players.name`,
            hint: `${SWADESundries.MOD_ID}.settings.sct.players.hint`,
            config: true,
            default: false,
            scope: 'world',
            type: Boolean,
        });

        game.settings.register(SWADESundries.MOD_ID, 'sct.npcs', {
            name: `${SWADESundries.MOD_ID}.settings.sct.npcs.name`,
            hint: `${SWADESundries.MOD_ID}.settings.sct.npcs.hint`,
            config: true,
            default: false,
            scope: 'world',
            type: Boolean,
        });

        game.settings.register(SWADESundries.MOD_ID, 'sct.showwounds', {
            name: `${SWADESundries.MOD_ID}.settings.sct.showwounds.name`,
            hint: `${SWADESundries.MOD_ID}.settings.sct.showwounds.hint`,
            config: true,
            default: true,
            scope: 'world',
            type: Boolean,
        });

        game.settings.register(SWADESundries.MOD_ID, 'sct.showfat', {
            name: `${SWADESundries.MOD_ID}.settings.sct.showfat.name`,
            hint: `${SWADESundries.MOD_ID}.settings.sct.showfat.hint`,
            config: true,
            default: true,
            scope: 'world',
            type: Boolean,
        });

        game.settings.register(SWADESundries.MOD_ID, 'sct.showconv', {
            name: `${SWADESundries.MOD_ID}.settings.sct.showconv.name`,
            hint: `${SWADESundries.MOD_ID}.settings.sct.showconv.hint`,
            config: true,
            default: true,
            scope: 'world',
            type: Boolean,
        });

        SWADESundries.api.socket?.register(`sct.create`, SWADESundries.api.sct.create);
        SWADESundries.api.socket?.register(`sct.createPosOrNeg`, SWADESundries.api.sct.createPosOrNeg);
        SWADESundries.api.socket?.register(`sct.createPos`, SWADESundries.api.sct.createPos);
        SWADESundries.api.socket?.register(`sct.createNeg`, SWADESundries.api.sct.createNeg);

        Hooks.on(`updateActor`, SWADESundries.api.sct.onUpdateActor);
    }
}

class SWADESundriesSourceLink {
    getDocIfCanView(uuid) {
        if (!uuid || !uuid?.length) return undefined;

        if (!SWADESundries.getSetting('slink.itemsheet.user') && !game.user.isGM) return undefined;
        if (!SWADESundries.getSetting('slink.itemsheet.gm') && game.user.isGM) return undefined;

        const doc = fromUuidSync(uuid);
        if (!doc) return undefined;

        if (!game.user.isGM && doc.pack?.length) {
            if (!game.packs.get(doc.pack)?.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER, false)) {
                return undefined;
            }
        }

        return doc;
    }

    getSource(item) {
        if (item?._stats?.compendiumSource?.length) return item?._stats?.compendiumSource;
        if (item?._stats?.duplicateSource?.length) return item?._stats?.duplicateSource;
        if (item?.flags?.core?.sourceId?.length) return item?.flags?.core?.sourceId;

        return undefined;
    }

    getItemSourceUuidForChatMessage(li) {
        const message = game.messages.get(li?.dataset?.messageId);
        if (!message) return undefined;
        if (message.type !== 'itemCard') return undefined;
        if (!message.isOwner && !game.user.isGM) return undefined;

        return SWADESundries.api.sourcelink.getSource(message?.system?._item);
    }


    onGetSwadeItemSheetV2HeaderButtons(app, buttons) {
        const source = SWADESundries.api.sourcelink.getSource(app?.object);
        const doc = SWADESundries.api.sourcelink.getDocIfCanView(source);
        if (!doc) return;

        buttons?.unshift({
            label: '',
            class: 'swade-sundries-source',
            icon: 'fa-solid fa-book-copy',
            onclick: () => { return SWADESundriesUtil.openSheet(source) },
        });
    }

    onChatMessageCheckCondition(li) {
        const source = SWADESundries.api.sourcelink.getItemSourceUuidForChatMessage(li);
        const doc = SWADESundries.api.sourcelink.getDocIfCanView(source);
        if (!doc) return false;
        return true;
    }

    onChatMessageCallback(li) {
        const source = SWADESundries.api.sourcelink.getItemSourceUuidForChatMessage(li);
        const doc = SWADESundries.api.sourcelink.getDocIfCanView(source);
        if (!doc) return;
        return SWADESundriesUtil.openSheet(source);
    }

    onGetChatMessageContextOptions(app, items) {
        if (!SWADESundries.getSetting('slink.chatctx')) return;
        items?.unshift({
            name: 'swade-sundries.chat.context.item.opensource',
            icon: '<i class="fa-solid fa-book-copy"></i>',
            condition: (li) => { return SWADESundries.api.sourcelink.onChatMessageCheckCondition(li) },
            callback: (li) => { return SWADESundries.api.sourcelink.onChatMessageCallback(li) },
        });
    }

    register() {
        game.settings.register(SWADESundries.MOD_ID, 'slink.itemsheet.gm', {
            name: `${SWADESundries.MOD_ID}.slink.itemsheet.gm.name`,
            hint: `${SWADESundries.MOD_ID}.slink.itemsheet.gm.hint`,
            config: true,
            default: false,
            scope: 'world',
            type: Boolean,
        });

        game.settings.register(SWADESundries.MOD_ID, 'slink.itemsheet.user', {
            name: `${SWADESundries.MOD_ID}.slink.itemsheet.user.name`,
            hint: `${SWADESundries.MOD_ID}.slink.itemsheet.user.hint`,
            config: true,
            default: false,
            scope: 'world',
            type: Boolean,
        });

        game.settings.register(SWADESundries.MOD_ID, 'slink.chatctx', {
            name: `${SWADESundries.MOD_ID}.slink.chatctx.name`,
            hint: `${SWADESundries.MOD_ID}.slink.chatctx.hint`,
            config: true,
            default: false,
            scope: 'world',
            type: Boolean,
        });

        Hooks.on(`getSwadeItemSheetV2HeaderButtons`, SWADESundries.api.sourcelink.onGetSwadeItemSheetV2HeaderButtons)
        Hooks.on(`getChatMessageContextOptions`, SWADESundries.api.sourcelink.onGetChatMessageContextOptions)
    }
}

class SWADESundriesChatItemLink {
    getItemUuidForChatMessage(li) {
        const message = game.messages.get(li?.dataset?.messageId);
        if (!message) return undefined;
        if (message.type !== 'itemCard') return undefined;
        if (!message.isOwner && !game.user.isGM) return undefined;

        return message?.system?._item?.uuid;
    }


    onChatMessageCheckCondition(li) {
        const uuid = SWADESundries.api.itemlink.getItemUuidForChatMessage(li);
        if (!uuid?.length) return false;
        return true;
    }

    onChatMessageCallback(li) {
        const uuid = SWADESundries.api.itemlink.getItemUuidForChatMessage(li);
        if (!uuid?.length) return false;
        SWADESundriesUtil.openSheet(uuid);
    }

    onGetChatMessageContextOptions(app, items) {
        if (!SWADESundries.getSetting('chat.itemlink')) return;
        items?.unshift({
            name: 'swade-sundries.chat.context.item.open',
            icon: '<i class="fa-solid fa-suitcase"></i>',
            condition: (li) => { return SWADESundries.api.itemlink.onChatMessageCheckCondition(li) },
            callback: (li) => { return SWADESundries.api.itemlink.onChatMessageCallback(li) },
        });
    }

    register() {
        game.settings.register(SWADESundries.MOD_ID, 'chat.itemlink', {
            name: `${SWADESundries.MOD_ID}.chat.itemlink.name`,
            hint: `${SWADESundries.MOD_ID}.chat.itemlink.hint`,
            config: true,
            default: false,
            scope: 'world',
            type: Boolean,
        });

        Hooks.on(`getChatMessageContextOptions`, SWADESundries.api.itemlink.onGetChatMessageContextOptions)
    }
}

class SWADESundriesRollConvert {
    async onChatMessageCallback(li) {
        if (!game.user.isGM) return false;
        const message = game.messages.get(li?.dataset?.messageId);
        if (!message) return false;
        if (!message.isRoll || !message?.significantRoll || message?.significantRoll?.rollType === 'damage') return false;
        let significantRoll = message.significantRoll?.toJSON();
        if (!significantRoll) return false;

        const confirm = await foundry.applications.api.DialogV2.confirm({
            window: { title: 'swade-sundries.chat.context.roll.convertdamage.label'},
            content: `<p>${game.i18n.localize('swade-sundries.chat.context.roll.convertdamage.confirm')}</p>`
        });
        if (!confirm) return;

        significantRoll.class = 'DamageRoll';
        return message.update({'rolls': [significantRoll]});
    }

    onGetChatMessageContextOptions(app, items) {
        console.log('onGetChatMessageContextOptions', app, items);
        items?.unshift({
            name: 'swade-sundries.chat.context.roll.convertdamage.label',
            icon: '<i class="fa-solid fa-heart-crack"></i>',
            condition: (li) => {
                const message = game.messages.get(li?.dataset?.messageId);
                if (!game.user.isGM || !message?.isRoll || message?.significantRoll?.rollType === 'damage') return false;
                return true;
            },
            callback: (li) => { return SWADESundries.api.rollconvert.onChatMessageCallback(li) },
        });
    }

    register() {
        Hooks.on(`getChatMessageContextOptions`, SWADESundries.api.rollconvert.onGetChatMessageContextOptions)
    }
}

class SWADESundries {
    static MOD_ID = 'swade-sundries';
    static MOD_KEY_REMINDER_PREFIX = `flags.${SWADESundries.MOD_ID}.r.`;

    constructor() {
        this.util = SWADESundriesUtil;
        this.reminders = new SWADESundriesReminders();
        this.inventory = new SWADESundriesInventory();
        this.sct = new SWADESundriesSCT();
        this.sourcelink = new SWADESundriesSourceLink();
        this.itemlink = new SWADESundriesChatItemLink();
        this.rollconvert = new SWADESundriesRollConvert();
    }

    static get api() {
        const mod = game.modules.get(SWADESundries.MOD_ID);
        if (!mod.api) {
            mod.api = new SWADESundries();
        }
        return mod.api;
    }

    static getSetting(key) {
        return game.settings.get(SWADESundries.MOD_ID, key);
    }

    register() {
        game.settings.register(SWADESundries.MOD_ID, 'socket.enabled', {
            name: `${SWADESundries.MOD_ID}.settings.socket.enabled.name`,
            hint: `${SWADESundries.MOD_ID}.settings.socket.enabled.hint`,
            config: !!socketlib,
            default: false,
            requiresReload: true,
            scope: 'world',
            type: Boolean,
        });
        if (socketlib && SWADESundries.getSetting('socket.enabled')) {
            SWADESundries.api.socket = socketlib.registerModule(SWADESundries.MOD_ID);
        }
        SWADESundries.api.reminders?.register();
        SWADESundries.api.inventory?.register();
        SWADESundries.api.sct?.register();
        SWADESundries.api.sourcelink?.register();
        SWADESundries.api.itemlink?.register();
        SWADESundries.api.rollconvert?.register();
    }
}

Hooks.once('init', async function () {
    SWADESundries.api.register();
});
