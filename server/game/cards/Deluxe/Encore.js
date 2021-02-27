const Card = require('../../Card.js');

class Encore extends Card {
    setupCardAbilities(ability) {
        this.play({
            title: 'Encore',
            effect: 'deal 1 damage to all units',
            targets: {
                myCard: {
                    activePromptTitle: 'Select a card to return to your deck',
                    controller: 'self',
                    location: 'discard',
                    optional: true
                },
                action: {
                    mode: 'select',
                    dependsOn: 'myCard',
                    player: 'self',
                    activePromptTitle: 'Choose where to return it to',
                    choices: {
                        Top: this.game.actions.returnToDeck((context) => ({
                            target: context.targets.myCard,
                            shuffle: false
                        })),
                        Bottom: this.game.actions.returnToDeck((context) => ({
                            bottom: true,
                            target: context.targets.myCard,
                            shuffle: false
                        }))
                    }
                }
            },
            then: {
                alwaysTriggers: true,
                gameAction: ability.actions.draw()
            }
        });
    }
}

Encore.id = 'encore';

module.exports = Encore;
