const { Level, Magic } = require('../../../constants.js');
const Card = require('../../Card.js');
const DiceCount = require('../../DiceCount.js');

class SummonSilverSnake extends Card {
    setupCardAbilities(ability) {
        this.spellGuard({
            location: 'spellboard'
        });

        this.summon('silver-snake', {
            title: 'Summon Silver Snake',
            cost: [
                ability.costs.mainAction(),
                ability.costs.exhaust(),
                ability.costs.dice([
                    new DiceCount(1, Level.Power, Magic.Charm),
                    new DiceCount(1, Level.Power, Magic.Natural)
                ])
            ],
            location: 'spellboard',
            then: {
                gameAction: ability.actions.addStatusToken((context) => ({
                    amount: Math.min(context.source.focus, 2),
                    target: context.preThenEvent.cards
                }))
            }
        });
    }
}

SummonSilverSnake.id = 'summon-silver-snake';

module.exports = SummonSilverSnake;
