const Card = require('../../Card.js');
const { BattlefieldTypes, CardType, PhoenixbornTypes } = require('../../../constants.js');

class MoltenGold extends Card {
    setupCardAbilities(ability) {
        this.play({
            title: 'Molten Gold',
            target: {
                cardType: [...BattlefieldTypes, ...PhoenixbornTypes],
                gameAction: ability.actions.addDamageToken({ amount: 3 })
            }
        });
    }
}

MoltenGold.id = 'molten-gold';

module.exports = MoltenGold;
