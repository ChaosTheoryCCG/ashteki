const Card = require('../../Card.js');
const { BattlefieldTypes } = require('../../../constants');

class BloodArcher extends Card {
    setupCardAbilities(ability) {
        this.action({
            title: 'Blood Shot',
            cost: [ability.costs.sideAction()],
            effect: 'deal 1 damage to a unit',
            gameAction: ability.actions.addDamageToken((context) => ({
                target: context.source
            })),
            then: {
                target: {
                    activePromptTitle: 'Blood Shot',
                    cardType: BattlefieldTypes,
                    gameAction: ability.actions.dealDamage({ amount: 1, showMessage: true })
                }
            }
        });
    }
}

BloodArcher.id = 'blood-archer';

module.exports = BloodArcher;
