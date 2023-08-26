import * as me from 'melonjs';
import { DebugPanelPlugin } from "debugPlugin";
import * as Spine from 'spinePlugin'

import DataManifest from './manifest.js'
import SpineRenderable from "./renderables/spine.js";

/**
 *
 * Initialize the application
 */
export default function player(x, y, atlasFile, jsonFile, defaultAnimation, skinName) {

	// Initialize the video.
	if (!me.video.init(1462, 1119, {parent : "screen", renderer: me.video.AUTO, scale : "auto", scaleMethod: "fit" , antiAlias: true})) {
		alert("Your browser does not support HTML5 canvas.");
		return;
	}

	// add some keyboard shortcuts
	me.event.on(me.event.KEYDOWN, (action, keyCode /*, edge */) => {
		// toggle fullscreen on/off
		if (keyCode === me.input.KEY.F) {
			if (!me.device.isFullscreen()) {
				me.device.requestFullscreen();
			} else {
				me.device.exitFullscreen();
			}
		}
	});

	// register the debug plugin
	me.plugin.register(DebugPanelPlugin, "debugPanel");

	// allow cross-origin for image/texture loading
	me.loader.crossOrigin = "anonymous";

	me.loader.preload(DataManifest, async function() {
		me.state.change(me.state.DEFAULT, true);

		// load spine assets
		Spine.assetManager.setPrefix("data/spine/")
		Spine.assetManager.loadAsset(atlasFile, jsonFile);
		await Spine.assetManager.loadAll();

		me.game.world.backgroundColor.parseCSS("#202020");

		// pass add atlas and json file in through object constructor
		let spineRenderable = new SpineRenderable(x, y, {atlasFile: atlasFile, jsonFile: jsonFile});
		
		// set skin
		if (typeof skinName !== "undefined") {
			spineRenderable.setSkinByName(skinName);
		}

		// set default animation
		if (typeof defaultAnimation !== "undefined") {
			spineRenderable.setAnimation(0, defaultAnimation, true);
		}

		// add all object to the game world
		me.game.world.addChild(spineRenderable);
		
	});
};

