const Card = require('../Card');
const ThenAbility = require('../ThenAbility');

class UltimateCard extends Card {
    getImageStub() {
        return this.imageStub.replace('%s', this.owner.chimeraPhase);
    }

    getUltimateAbility(phase) {
        // override this in derived classes
    }

    // internal utility method for building a behaviour ability
    ultimate(properties) {
        return new ThenAbility(this.game, this.owner.phoenixborn, properties);
    }
}

module.exports = UltimateCard;
