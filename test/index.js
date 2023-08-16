import * as me from 'melonjs';
import { DebugPanelPlugin } from "debugPlugin";
import * as Spine from 'spinePlugin'

import game from './js/game.js'
import TestStage from './js/stage/test.js'
import DataManifest from './manifest.js'

/**
 *
 * Initialize the application
 */
export default function onload() {
	// initialize the display canvas once the device/browser is ready
	if (!me.video.init(1920, 1280, {parent : "screen", renderer: me.video.AUTO, scale : "auto", scaleMethod: "fit" , antiAlias: true})) {
		alert("Your browser does not support HTML5 canvas.");
		return;
	}

    // register the debug plugin
    me.plugin.register(DebugPanelPlugin,  "debugPanel");

	// set and load all resources.
	// allow cross-origin for image/texture loading
	me.loader.crossOrigin = "anonymous";
	me.loader.preload(DataManifest, async function() {
		me.state.set(me.state.PLAY, new TestStage());
		
		// global texture Atlas
		game.textureAtlas = new me.TextureAtlas([me.loader.getJSON("texture_image_0")], undefined, false);

		// load spine asset	
		Spine.assetManager.setPrefix("data/spine/")
		Spine.assetManager.loadAsset("alien.atlas", "alien-ess.json");
		Spine.assetManager.loadAsset("coin-pma.atlas","coin-pro.json");
		Spine.assetManager.loadAsset("dragon-pma.atlas", "dragon-ess.json");
		Spine.assetManager.loadAsset("goblins-pma.atlas", "goblins-pro.json");
		Spine.assetManager.loadAsset("mix-and-match-pma.atlas", "mix-and-match-pro.json");
		Spine.assetManager.loadAsset("spineboy-pma.atlas", "spineboy-pro.json");
		await Spine.assetManager.loadAll();

		me.state.change(me.state.PLAY);
	});

};

