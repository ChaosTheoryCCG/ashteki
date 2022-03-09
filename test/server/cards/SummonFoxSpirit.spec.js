describe('Summon Fox Spirit', function () {
    describe('Action when not focused', function () {
        beforeEach(function () {
            this.setupTest({
                player1: {
                    phoenixborn: 'orrick-gilstream',
                    inPlay: ['hammer-knight', 'anchornaut'],
                    dicepool: ['natural', 'time', 'charm', 'charm', 'time', 'illusion'],
                    spellboard: ['summon-fox-spirit'],
                    archives: ['fox-spirit'],
                    deck: ['anchornaut']
                },
                player2: {
                    phoenixborn: 'aradel-summergaard',
                    dicepool: ['natural'],
                    inPlay: ['iron-worker'],
                    spellboard: ['chant-of-revenge']
                }
            });
        });

        it("doesn't require action type selection", function () {
            expect(this.player1.actions.main).toBe(true);
            this.player1.clickCard(this.summonFoxSpirit);
            this.player1.clickPrompt('Summon Fox Spirit');
            //don't require action type selection
            expect(this.foxSpirit.location).toBe('play area');
            expect(this.player1.actions.main).toBe(false);
            expect(this.player1).toHavePrompt('Choose a die to raise'); // Keen 1
        });
    });

    describe('Action when focused', function () {
        beforeEach(function () {
            this.setupTest({
                player1: {
                    phoenixborn: 'orrick-gilstream',
                    inPlay: ['hammer-knight', 'anchornaut'],
                    dicepool: ['natural', 'time', 'charm', 'charm', 'time', 'illusion'],
                    spellboard: ['summon-fox-spirit', 'summon-fox-spirit'],
                    archives: ['fox-spirit'],
                    deck: ['anchornaut']
                },
                player2: {
                    phoenixborn: 'aradel-summergaard',
                    dicepool: ['natural'],
                    inPlay: ['iron-worker'],
                    spellboard: ['chant-of-revenge']
                }
            });
            this.ironWorker.tokens.exhaustion = 1;
        });

        it('choice of main action', function () {
            this.player1.clickCard(this.summonFoxSpirit);
            this.player1.clickPrompt('Summon Fox Spirit');
            //require action type selection
            this.player1.clickPrompt('main');
            expect(this.player1.actions.main).toBe(false);
            expect(this.player1.actions.side).toBe(1);
            expect(this.foxSpirit.location).toBe('play area');
            expect(this.player1).toHavePrompt('Choose a die to raise'); // Keen 1
        });

        it('choice of side action', function () {
            this.player1.clickCard(this.summonFoxSpirit);
            this.player1.clickPrompt('Summon Fox Spirit');
            //require action type selection
            this.player1.clickPrompt('side');
            expect(this.player1.actions.main).toBe(true);
            expect(this.player1.actions.side).toBe(0);
            expect(this.foxSpirit.location).toBe('play area');
            expect(this.player1).toHavePrompt('Choose a die to raise'); // Keen 1
            this.player1.clickDie(0);
            this.player1.clickPrompt('Attack');
            this.player1.clickCard(this.ironWorker);
            this.player1.clickCard(this.foxSpirit);

            expect(this.foxSpirit.attack).toBe(3); // Pounce
        });
    });
});