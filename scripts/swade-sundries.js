class SWADESundriesUtil {
    static stringToHTML(str) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(str, 'text/html');
        return doc.body.firstElementChild;
    }

    static trimSuffix(str, suffix) {
        return str.endsWith(suffix) ? str.slice(0, -suffix.length) : str
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
            (nameSWID === 'agility' || nameSWID === 'strength' || nameSWID === 'vigor')) return true;
        if (reminder.key === 'attributem' && rollInfo.type === 'attribute' &&
            (nameSWID === 'smarts' || nameSWID === 'spirit')) return true;
        if (reminder.key === 'agi' && rollInfo.type === 'attribute' && nameSWID === 'agility') return true;
        if (reminder.key === 'sma' && rollInfo.type === 'attribute' && nameSWID === 'smarts') return true;
        if (reminder.key === 'spr' && rollInfo.type === 'attribute' && nameSWID === 'spirit') return true;
        if (reminder.key === 'spi' && rollInfo.type === 'attribute' && nameSWID === 'spirit') return true;
        if (reminder.key === 'str' && rollInfo.type === 'attribute' && nameSWID === 'strength') return true;
        if (reminder.key === 'vig' && rollInfo.type === 'attribute' && nameSWID === 'vigor') return true;

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
                if (!c.key.startsWith(SWADESundries.MOD_REMINDER_KEY_PREFIX)) continue;
                const k = c.key.slice(SWADESundries.MOD_REMINDER_KEY_PREFIX.length);
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

class SWADESundries {
    static MOD_ID = 'swade-sundries';
    static MOD_REMINDER_KEY_PREFIX = `flags.${SWADESundries.MOD_ID}.r.`;

    constructor() {
        this.reminders = new SWADESundriesReminders();
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
        SWADESundries.api.reminders?.register();
    }
}

Hooks.once('init', async function () {
    SWADESundries.api.register();
});
