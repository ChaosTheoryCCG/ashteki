const AbilityDsl = require("../../abilitydsl");
const RevealBehaviour = require("../../BaseActions/RevealBehaviour");
const BehaviourCard = require("../../solo/BehaviourCard");

class VirosBehaviour1 extends BehaviourCard {
    handleBehaviourRoll(behaviourRoll) {
        switch (behaviourRoll) {
            case 1:
            case 2:
                this.doReveal();
                break;
            case 3:
            case 4:
                this.canAttack() ? this.doAttack() : this.doReveal();
                break;
            case 5:
            case 6:
                // Main: Reveal. Attack with revealed aspect
                // TODO: use revealed aspect
                const attacker = this.doReveal();
                this.doAttack(attacker);
                break;
            case 7:
            case 8:
            case 9:
                // Side: Target opposing player must lower 2 non-basic dice in their active pool one level.
                // Main: Reveal
                this.doReveal();
                break;
            case 10:
            case 11:
                // Side: Raise 1 basic rage die one level

                // Main: Reveal
                this.doReveal();
                break;
            case 12:
                // Side: Place 1 Red Rains token on the Chimera.
                this.doAddRedRains();
                // Main: Reveal
                this.doReveal();
                break;
            default:
                throw new Error('Unexpected behaviour roll');
        }
    }

    doReveal() {
        const target = this.owner.threatZone[0];
        const act = new RevealBehaviour(target);
        const context = act.createContext(this.owner);
        this.game.resolveAbility(context);
        return target;
    }

    canAttack() {
        return this.owner.canAttack();
    }

    doAttack(attackWith) {
        const attacker = attackWith || this.owner.getAttacker();
        const target = this.owner.getAttackTarget(attacker);

        const attackAbility = this.behaviour({
            title: 'Attack',
            gameAction: AbilityDsl.actions.attack({
                attacker: attacker,
                target: target
            })
        });

        const context = attackAbility.createContext(this.owner);
        this.game.resolveAbility(context);
    }

    doAddRedRains() {
        const ability = this.behaviour({
            gameAction: AbilityDsl.actions.addRedRainsToken({})
        });
        const context = ability.createContext(this.owner);
        this.game.resolveAbility(context);
    }
}

VirosBehaviour1.id = 'viros-behaviour-1';

module.exports = VirosBehaviour1