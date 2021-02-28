const Card = require('../../Card.js');
class Augury extends Card {
    setupCardAbilities(ability) {
        this.entersPlay({
            gameAction: ability.actions.addStatusToken(() => ({
                amount: 3,
                target: this
            }))
        });

        this.action({
            title: 'Augury Search',
            location: 'spellboard',
            cost: [ability.costs.sideAction(), ability.costs.exhaust()],
            target: {
                cardCondition: (card) => card.magicCost === this.status,
                gameAction: [
                    ability.actions.reveal(),
                    ability.actions.moveCard({ destination: 'hand' }),
                    ability.actions.removeStatus({ target: this })
                ]
            }
        });
    }
}

Augury.id = 'chant-of-revenge';

module.exports = Augury;
