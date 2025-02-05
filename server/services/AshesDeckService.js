const logger = require('../log.js');
const monk = require('monk');
const util = require('../util.js');
const DeckForge = require('./generator/deckForge.js');
const Carousel = require('./generator/carousel.js');

class AshesDeckService {
    constructor(configService, db) {
        if (!db) {
            const mongoUrl = process.env.MONGO_URL || configService.getValue('mongo');
            db = monk(mongoUrl);
        }

        this.decks = db.get('decks');
        this.preconDecks = db.get('precon_decks');
    }

    getById(id) {
        return this.decks.findOne({ _id: id }).catch((err) => {
            logger.error('Unable to fetch deck', err);
            throw new Error('Unable to fetch deck ' + id);
        });
    }

    getByAshesLiveUuid(id) {
        return this.decks.findOne({ ashesLiveUuid: id }).catch((err) => {
            logger.error('Unable to fetch deck', err);
            throw new Error('Unable to fetch deck ' + id);
        });
    }

    getPreconDeckById(id) {
        return this.preconDecks.findOne({ _id: id }).catch((err) => {
            logger.error('Unable to fetch precon deck', err);
            throw new Error('Unable to fetch precon deck ' + id);
        });
    }

    getChimeraDeck() {
        return this.preconDecks.findOne({ mode: 'chimera' }).catch((err) => {
            logger.error('Unable to fetch a chimera deck', err);
            throw new Error('Unable to fetch a chimera deck ');
        });
    }

    getPreconDecks(preconGroup = 1) {
        return this.preconDecks.find({ 'precon_group': preconGroup }, { sort: { precon_id: 1 } });
    }

    async findByUserName(userName, options, applyLimit = true) {
        let nameSearch = '';
        let pbSearch = '';
        let faveSearch = false;
        let limit = 0;
        let skip = 0;
        if (options && applyLimit) {
            limit = options.pageSize * 1;
            skip = limit * (options.page - 1);
        }
        if (options && options.filter) {
            for (let filterObject of options.filter || []) {
                if (filterObject.name === 'name') {
                    nameSearch = filterObject.value;
                }
                if (filterObject.name === 'pb') {
                    pbSearch = filterObject.value;
                }
                if (filterObject.name === 'favourite') {
                    faveSearch = filterObject.value === 'true';
                }
            }
        }
        const searchFields = { username: userName };
        if (nameSearch !== '') {
            searchFields.name = { $regex: nameSearch, $options: 'i' };
        }
        if (pbSearch !== '') {
            searchFields['phoenixborn.id'] = { $regex: pbSearch, $options: 'i' };
        }
        if (faveSearch) {
            searchFields['favourite'] = true;
        }
        return await this.decks.find(searchFields, {
            // sort: { [options.sort]: options.sortDir == 'desc' ? -1 : 1 },
            // skip: skip,
            // limit: limit
        });
    }

    clearPrecons() {
        return this.preconDecks.remove({});
    }

    createPrecon(deck) {
        let properties = this.getDeckProperties(deck, true);

        return this.preconDecks.insert(properties);
    }

    create(deck) {
        let properties = this.getDeckProperties(deck);

        return this.decks.insert(properties);
    }

    async import(user, deck, resync = false) {
        let deckResponse = await this.getAshesLiveDeck(deck, resync);

        let newDeck = this.parseAshesLiveDeckResponse(user, deckResponse);
        newDeck.ashesLiveUuid = deck.uuid;

        // is this an update
        let response;
        if (resync) {
            // update the deck data
            response = await this.getById(deck.id);
            response = Object.assign(response, newDeck);
            // save the deck
            this.update(response);
        } else {
            response = await this.create(newDeck);
        }

        return this.getById(response._id);
    }

    async getAshesLiveDeck(deck, resync) {
        try {
            // get by uuid (private share, or snapshot)
            let response = await util.httpRequest(
                `https://api.ashes.live/v2/decks/shared/${deck.uuid}`
            );

            if (response[0] === '<') {
                logger.error('Deck failed to import: %s %s', deck.uuid, response);

                throw new Error('Invalid response from api. Please try again later.');
            }

            let deckResponse = JSON.parse(response);

            if (resync && deckResponse.is_snapshot && deckResponse.source_id) {
                const sourceDeckId = deckResponse.source_id;
                // get latest published deck by deck id
                response = await util.httpRequest(
                    `https://api.ashes.live/v2/decks/${sourceDeckId}`
                );

                if (response[0] === '<') {
                    logger.error('Deck failed to import by id: %s %s', sourceDeckId, response);

                    throw new Error('Invalid response from api. Please try again later.');
                }

                deckResponse = JSON.parse(response).deck;
            }

            if (!deckResponse || !deckResponse.cards) {
                throw new Error('Invalid response from Api - no cards. Please try again later.');
            }

            return deckResponse;
        } catch (error) {
            logger.error(`Unable to import deck ${deck.uuid}`, error);

            throw new Error('Invalid response from Api. Please try again later.');
        }
    }

    parseAshesLiveDeckResponse(user, ashesLiveDeck) {
        return {
            username: user.username,
            name: ashesLiveDeck.title,
            phoenixborn: [
                {
                    id: ashesLiveDeck.phoenixborn.stub,
                    count: 1
                }
            ],
            dicepool: ashesLiveDeck.dice.map((d) => ({ magic: d.name, count: d.count })),
            cards: ashesLiveDeck.cards.map((c) => ({ id: c.stub, count: c.count })),
            conjurations: ashesLiveDeck.conjurations.map((c) => ({ id: c.stub, count: c.count })),
            notes: ashesLiveDeck.description,
            ashesLiveModified: ashesLiveDeck.modified
        };
    }

    getDeckProperties(deck, isPrecon) {
        let properties = {
            mode: deck.mode,
            name: deck.deckName || deck.name,
            phoenixborn: deck.phoenixborn,
            ultimate: deck.ultimate,
            behaviour: deck.behaviour,
            dicepool: deck.dicepool,
            cards: deck.cards,
            conjurations: deck.conjurations,
            notes: deck.notes,
            lastUpdated: new Date(),
            created: new Date(),
            ashesLiveUuid: deck.ashesLiveUuid,
            ashesLiveModified: deck.ashesLiveModified
        };
        if (isPrecon) {
            properties = Object.assign(properties, {
                precon_id: deck.precon_id,
                precon_group: deck.preconGroup,
                premium: deck.premium,
                listClass: deck.listClass,
                restricted: deck.restricted
            });
        } else {
            properties = Object.assign(properties, { username: deck.username });
        }
        return properties;
    }

    update(deck) {
        let properties = {
            name: deck.deckName || deck.name,
            phoenixborn: deck.phoenixborn,
            ultimate: deck.ultimate,
            behaviour: deck.behaviour,
            dicepool: deck.dicepool,
            cards: deck.cards,
            conjurations: deck.conjurations,
            notes: deck.notes,
            ashesLiveModified: deck.ashesLiveModified,
            favourite: deck.favourite,
            lastUpdated: new Date()
        };

        return this.decks.update({ _id: deck.id || deck._id }, { $set: properties });
    }

    delete(id) {
        return this.decks.remove({ _id: id });
    }

    async getNumDecksForUser(username, options) {
        const userDecks = await this.findByUserName(username, options, false);
        //todo: handle options
        return userDecks ? userDecks.length : 0;
    }

    async getRandomChoice(user, deckType) {
        // this should choose a deck for the player
        let decks = [];
        switch (deckType) {
            case 0:
                // get my decks and choose one 
                decks = await this.findByUserName(user.username, null, false);

                break;
            default:
                // get precondecks then choose one
                decks = await this.getPreconDecks(deckType);
                break;
        }
        const i = Math.floor(Math.random() * decks.length);
        return decks[i];
    }

    getRandomDeck(cards) {
        // get a carousel dice spread
        const caro = new Carousel().getCarousel();
        console.log(
            'carousel: ' + caro.pb.name + ' (' + caro.dice.map((dObj) => dObj.magic).join(',') + ')'
        );

        const deck = new DeckForge(cards).createDeck(caro.pb.stub, caro.dice);
        deck.name = 'Feeling Lucky';
        return deck;
    }

    getCoalOffDeck(cards) {
        // get a carousel definition
        const caro = new Carousel().getCoalOff();
        console.log(
            'carousel: ' + caro.pb.name + ' (' + caro.dice.map((dObj) => dObj.magic).join(',') + ')'
        );

        const deck = new DeckForge(cards).createDeck('coal-roarkwin', caro.dice, {
            maxCardCount: 1,
            noExtras: true
        });
        deck.name = 'Coal Off!';
        return deck;
    }
}

module.exports = AshesDeckService;
