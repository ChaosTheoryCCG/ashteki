const { Level } = require("../../../constants");
const AspectCard = require("../../solo/AspectCard");

class Rampage extends AspectCard {
    setupCardAbilities(ability) {
        super.setupCardAbilities(ability);

        this.forcedReaction({
            inexhaustible: true,
            when: {
                // it's my turn
                onBeginTurn: (event, context) => event.player === context.player
            },
            location: 'play area',
            cost: [ability.costs.loseStatus(1)],
            target: {
                toSelect: 'die',
                autoTarget: (context) => context.player.dice.filter(d => d.level === Level.Basic),
                gameAction: ability.actions.rerollDice()
            },
            effect: 'reroll all basic dice'
        });
    }

    get statusCount() {
        return 2;
    }
}

Rampage.id = 'rampage';

module.exports = Rampage