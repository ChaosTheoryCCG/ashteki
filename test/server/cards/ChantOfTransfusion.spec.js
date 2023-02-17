describe('Chant of Transfusion', function () {
    describe('getting tokens', function () {
        beforeEach(function () {
            this.setupTest({
                player1: {
                    phoenixborn: 'aradel-summergaard',
                    inPlay: ['iron-worker'],
                    dicepool: ['natural', 'illusion', 'charm', 'charm']
                },
                player2: {
                    phoenixborn: 'coal-roarkwin',
                    inPlay: ['anchornaut'],
                    spellboard: ['chant-of-transfusion']
                }
            });
        });

        it('gets status token on ally destruction', function () {
            expect(this.chantOfTransfusion.status).toBe(0);

            this.player1.clickPrompt('Attack');
            this.player1.clickCard(this.anchornaut);
            this.player1.clickCard(this.ironWorker);
            this.player2.clickPrompt('Done'); // no guard
            this.player2.clickPrompt('No'); // no counter
            expect(this.anchornaut.location).toBe('discard');
            // prompt for jessa

            expect(this.chantOfTransfusion.status).toBe(1);
        });
    });

    describe('action', function () {
        beforeEach(function () {
            this.setupTest({
                player1: {
                    phoenixborn: 'coal-roarkwin',
                    inPlay: ['hammer-knight'],
                    spellboard: ['chant-of-transfusion'],
                    dicepool: ['ceremonial', 'ceremonial', 'charm', 'charm']
                },
                player2: {
                    phoenixborn: 'aradel-summergaard',
                    inPlay: ['iron-worker']
                }
            });
        });

        it('move wound from my unit to another', function () {
            this.chantOfTransfusion.tokens.status = 1;
            this.hammerKnight.tokens.damage = 2;
            expect(this.chantOfTransfusion.status).toBe(1);
            this.player1.clickCard(this.chantOfTransfusion);
            this.player1.clickPrompt('Transfusion');
            this.player1.clickPrompt('Main');

            this.player1.clickCard(this.hammerKnight);
            this.player1.clickCard(this.ironWorker);

            expect(this.chantOfTransfusion.status).toBe(0);
            expect(this.hammerKnight.damage).toBe(1);
            expect(this.ironWorker.damage).toBe(1);
        });
    });
});
