import * as me from 'melonjs';

import AlienSpine from '../renderables/alienspine.js';
import CoinSpine from '../renderables/coinspine.js';

export default class TestStage extends me.Stage {
	onResetEvent() {

        // Method 1
        // add atlas and json file in through object constructor
        var spineAlien = new AlienSpine(800, 900, {atlasFile: "alien.atlas", jsonFile: "alien-ess.json", width: 100, height: 100});
        
        // Method 2
        // add atlas and json by set skeleton
        var spineCoin = new CoinSpine(1500, 700, {width: 100, height: 100});
        spineCoin.setSkeleton("coin-pma.atlas", "coin-pro.json");
		spineCoin.setAnimation(0, "animation", true);

        me.game.world.backgroundColor.parseCSS("#202020");

        // add all object to the game world
        me.game.world.addChild(spineAlien);
        me.game.world.addChild(spineCoin);

        // force 0displaying the debug panel
        me.plugin.cache.debugPanel.show();
	}
};

