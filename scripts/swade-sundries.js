/*
@UUID[Compendium.swade-core-rules.swade-actions.Item.8EjMobPuRfHS0C5D]{Improved Frenzy}
flags.swade-sundries.r.all All rolls
flags.swade-sundries.r.attack Fighting, Shooting or Athletics skill
flags.swade-sundries.r.arcane Arcane skill
flags.swade-sundries.r.trait.all All trait rolls
flags.swade-sundries.r.trait.XYZ Rolls with skill XYZ
flags.swade-sundries.r.damage.all All damage rolls
flags.swade-sundries.r.damage.power All power damage rolls
flags.swade-sundries.r.damage.weapon All weapon damage rolls
flags.swade-sundries.r.damage.rweapon All ranged weapon damage rolls
flags.swade-sundries.r.damage.mweapon All melee weapon damage rolls
// Unarmed? Natural would need manual detection?
*/

class SWADESundries {
    static stringToHTML(str) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(str, 'text/html');
        return doc.body.firstElementChild;
    }

    static trimSuffix(str, suffix) {
        return str.endsWith(suffix) ? str.slice(0, -suffix.length) : str
    }

    static truncate(str, len) {
        if (!str || str.length < len) return str;
        if (len < 1) return '';
        if (str.length < len) return str;

        str = str.slice(0, len - 1);
        if (str.endsWith('.') || str.endsWith('!') || str.endsWith('?') ||
            str.endsWith('-') || str.endsWith('–') || str.endsWith(':')) {
            str = str.slice(0, str.length - 1);
        }
        return str + '…';
    }
}

class SWADESundriesAPI {
    static MOD_ID = 'swade-sundries';
    static MOD_REMINDER_KEY_PREFIX = `flags.${SWADESundriesAPI.MOD_ID}.r.`;
    LOG = true;

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

    isItemNameMatch(item, nameOrSWID) {
        if (!item || !nameOrSWID.length) return false;
        return item.name === nameOrSWID ||
            game.swade.util.slugify(item.name) === game.swade.util.slugify(nameOrSWID) ||
            item.system?.swid === game.swade.util.slugify(nameOrSWID);
    }

    findFirstMatchingItem(actor, nameOrSWID, type) {
        if (!actor?.items?.size || !nameOrSWID?.length) {
            console.log('findFirstMatchingItem returning early', actor, nameOrSWID, type);
            return undefined;
        }

        if (type === 'damage') {
            for (const i of actor.items) {
                if (!SWADESundriesAPI.api.isDamageItem(i)) continue;
                if (SWADESundriesAPI.api.isItemNameMatch(i, nameOrSWID)) return i;
            }
        } else if (type === 'skill') {
            for (const i of actor.items) {
                if (i.type !== 'skill') continue;
                if (SWADESundriesAPI.api.isItemNameMatch(i, nameOrSWID)) return i;
            }
        }

        return undefined;
    }

    parseTraitRoll(ret) {
        if (!ret) return ret;

        if (ret.title === 'Running' || ret.title === game.i18n.localize('SWADE.Running')) {
            ret.type = 'running';
            ret.name = 'running';
            return ret;
        }

        let suffix = ' ' + game.i18n.localize('SWADE.SkillTest');
        if (ret.title?.endsWith(suffix)) {
            ret.type = 'skill';
            ret.name = SWADESundries.trimSuffix(ret.title, suffix);
            return ret;
        }

        suffix = ' ' + game.i18n.localize('SWADE.AttributeTest');
        if (ret.title?.endsWith(suffix)) {
            ret.type = 'attribute';
            ret.name = SWADESundries.trimSuffix(ret.title, suffix);
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

        console.log(SWADESundriesAPI.MOD_ID, 'Unhandled trait roll for reminders:', roll.rollType);
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
        if (!ret.actor || !ret.roll) {
            console.log('parseRollInfo returning early', ret);
            return ret;
        }

        if (roll.rollType === 'damage') {
            ret.type = 'damage';
            const suffix = ' ' + game.i18n.localize('SWADE.Dmg');
            if (title.endsWith(suffix)) {
                ret.name = SWADESundries.trimSuffix(title, suffix);
            }
        } else if (roll.rollType === 'trait') {
            ret = SWADESundriesAPI.api.parseTraitRoll(ret);
        } else  {
            console.log(SWADESundriesAPI.MOD_ID, 'Unhandled roll type for reminders:', roll.rollType);
        }

        if (!ret.item) {
            ret.item = SWADESundriesAPI.api.findFirstMatchingItem(ret.actor, ret.name, ret.type);
        }

        return ret;
    }

    checkReminderApplies(reminder, rollInfo) {
        if (!reminder || reminder.key?.length, !reminder.text?.length, !rollInfo) return false;

        if (reminder.key === 'all') return true;
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
                if (!c.key.startsWith(SWADESundriesAPI.MOD_REMINDER_KEY_PREFIX)) continue;
                const k = c.key.slice(SWADESundriesAPI.MOD_REMINDER_KEY_PREFIX.length);
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

    handleRollReminders(app, html, context, options) {
        if (!game.settings.get(SWADESundriesAPI.MOD_ID, 'reminders.enabled')) return;

        let item = app?.ctx?.item;
        let actor = app?.ctx?.actor;
        if (!actor) actor = item?.actor;
        if (!actor) {
            console.log('No actor');
            return;
        }
        const reminders = SWADESundriesAPI.api.getReminders(actor);
        if (!reminders?.length) {
            console.log('No reminders');
            return;
        }
        const roll = app?.ctx?.roll;
        if (!roll) {
            console.log('no roll');
            return;
        }
        const title = app?.ctx?.title;

        const rollInfo = SWADESundriesAPI.api.parseRollInfo(actor, item, roll, title);
        let reminderContent = '';
        let reminderContentFull = '';
        for (const reminder of reminders) {
            if (SWADESundriesAPI.api.checkReminderApplies(reminder, rollInfo)) {
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

        const maxLen = game.settings.get(SWADESundriesAPI.MOD_ID, 'reminders.maxlen');
        if (maxLen <= 0) reminderContent = '';
        if (maxLen > 0) reminderContent = SWADESundries.truncate(reminderContent, maxLen);

        const insertAfter = app?.element?.querySelector('fieldset.formula');
        if (!insertAfter) return;

        const template = `
            <p class='${SWADESundriesAPI.MOD_ID} reminders'
               data-tooltip="${reminderContentFull}" data-tooltip-direction='UP'>
               ${reminderContent}
            </p>
        `;

        insertAfter.after(SWADESundries.stringToHTML(template));
    }

    register() {
        game.settings.register(SWADESundriesAPI.MOD_ID, 'reminders.enabled', {
            name: `${SWADESundriesAPI.MOD_ID}.settings.reminders.enabled.name`,
            hint: `${SWADESundriesAPI.MOD_ID}.settings.reminders.enabled.hint`,
            config: true,
            default: true,
            scope: 'world',
            type: Boolean,
        });

        game.settings.register(SWADESundriesAPI.MOD_ID, 'reminders.maxlen', {
            name: `${SWADESundriesAPI.MOD_ID}.settings.reminders.maxlen.name`,
            hint: `${SWADESundriesAPI.MOD_ID}.settings.reminders.maxlen.hint`,
            config: true,
            default: 128,
            scope: 'client',
            type: Number,
        });

        Hooks.on(`renderRollDialog`, this.handleRollReminders);
    }

    static get api() {
        const mod = game.modules.get(SWADESundriesAPI.MOD_ID);
        if (!mod.api) {
            mod.api = new SWADESundriesAPI();
        }
        return mod.api;
    }
}

Hooks.once('init', async function () {
    SWADESundriesAPI.api.register();
});
