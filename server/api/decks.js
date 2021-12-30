const passport = require('passport');

const ConfigService = require('../services/ConfigService');
const AshesDeckService = require('../services/AshesDeckService.js');
const { wrapAsync } = require('../util.js');
const logger = require('../log.js');
const AshesGameService = require('../services/AshesGameService');
const configService = new ConfigService();

const deckService = new AshesDeckService(configService);
const gameService = new AshesGameService(configService);

module.exports.init = function (server) {
    server.get(
        '/api/standalone-decks',
        wrapAsync(async function (req, res) {
            let decks;

            try {
                decks = await deckService.getPreconDecks();
            } catch (err) {
                logger.error('Failed to get precon decks', err);

                throw new Error('Failed to get precon decks');
            }

            res.send({ success: true, decks: decks });
        })
    );

    server.get(
        '/api/decks/:id',
        passport.authenticate('jwt', { session: false }),
        wrapAsync(async function (req, res) {
            if (!req.params.id || req.params.id === '') {
                return res.status(404).send({ message: 'No such deck' });
            }

            let deck = await deckService.getById(req.params.id);

            if (!deck) {
                return res.status(404).send({ message: 'No such deck' });
            }

            if (deck.username !== req.user.username) {
                return res.status(401).send({ message: 'Unauthorized' });
            }

            res.send({ success: true, deck: deck });
        })
    );

    server.get(
        '/api/decks',
        passport.authenticate('jwt', { session: false }),
        wrapAsync(async function (req, res) {
            let numDecks = await deckService.getNumDecksForUser(req.user, req.query);
            let decks = [];

            if (numDecks > 0) {
                const rawDecks = await deckService.findByUserName(req.user.username, req.query);
                decks = rawDecks.map((deck) => {
                    deck.usageLevel = 0;
                    deck.usageCount = undefined;

                    deck.played = 0;
                    deck.wins = 0;
                    deck.winRate = 0;
                    return deck;
                });

                await gameService.findByUserName(req.user.username).then((games) => {
                    games.forEach((game) => {
                        const player = game.players.find(p => p.name === req.user.username);
                        if (player && player.deckid) {
                            const deck = decks.find((d) => d._id.toString() === player.deckid);
                            if (deck) {
                                deck.played++;
                                if (game.winner === req.user.username) {
                                    deck.wins++;
                                }
                                deck.winRate = Math.round(deck.wins / deck.played * 100);
                            }
                        }
                    });
                })
                    .catch(error => {
                        console.log(error);
                    });
            }

            res.send({ success: true, numDecks: numDecks, decks: decks });
        })
    );

    server.post(
        '/api/decks',
        passport.authenticate('jwt', { session: false }),
        wrapAsync(async function (req, res) {
            if (!req.user) {
                return res.status(401).send({ message: 'Unauthorized' });
            }

            if (!req.body.uuid) {
                let deck = Object.assign(req.body, { username: req.user.username });
                await deckService.create(deck);
                res.send({ success: true });
            } else {
                let deck = Object.assign({}, { uuid: req.body.uuid, username: req.user.username });
                let savedDeck;

                try {
                    savedDeck = await deckService.import(req.user, deck);
                } catch (error) {
                    return res.send({
                        success: false,
                        message: error.message
                    });
                }

                if (!savedDeck) {
                    return res.send({
                        success: false,
                        message:
                            'An error occurred importing your deck.  Please check the Url or try again later.'
                    });
                }

                res.send({ success: true, deck: savedDeck });
            }
        })
    );

    server.put(
        '/api/decks/:id',
        passport.authenticate('jwt', { session: false }),
        wrapAsync(async function (req, res) {
            if (!req.user) {
                return res.status(401).send({ message: 'Unauthorized' });
            }

            let deck = await deckService.getById(req.params.id);

            if (!deck) {
                return res.status(404).send({ message: 'No such deck' });
            }

            if (deck.username !== req.user.username) {
                return res.status(401).send({ message: 'Unauthorized' });
            }

            let data = Object.assign({ id: req.params.id }, req.body);

            deckService.update(data);

            res.send({ success: true, message: 'Saved' });
        })
    );

    server.delete(
        '/api/decks/:id',
        passport.authenticate('jwt', { session: false }),
        wrapAsync(async function (req, res) {
            let id = req.params.id;

            let deck = await deckService.getById(id);

            if (!deck) {
                return res.status(404).send({ success: false, message: 'No such deck' });
            }

            if (deck.username !== req.user.username) {
                return res.status(401).send({ message: 'Unauthorized' });
            }

            await deckService.delete(id);
            res.send({ success: true, message: 'Deck deleted successfully', deckId: id });
        })
    );
};
