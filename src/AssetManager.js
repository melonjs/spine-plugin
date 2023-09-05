import { event, video } from "melonjs";
import * as spineWebGL from "@esotericsoftware/spine-webgl";
import * as spineCanvas from "@esotericsoftware/spine-canvas";

/**
 * @classdesc
 * An Asset Manager class to load spine assets
 */
export default class AssetManager {
    asset_manager;
    pathPrefix;

    /**
     * @param {string} [pathPrefix=""] - a default path prefix for assets location
     */
    constructor(pathPrefix = "") {
        event.once(event.VIDEO_INIT, () => {
            this.pathPrefix = pathPrefix;
            if (video.renderer.WebGLVersion >= 1) {
                this.asset_manager = new spineWebGL.AssetManager(video.renderer.getContext(), this.pathPrefix);
            } else {
                // canvas renderer
                this.asset_manager = new spineCanvas.AssetManager(this.pathPrefix);
            }
        });
    }

    /**
     * set a default path prefix for assets location
     * @see loadAsset
     * @param {string} pathPrefix
     */
    setPrefix(pathPrefix) {
        this.asset_manager.pathPrefix =  this.pathPrefix = pathPrefix;
    }

    /**
     * define all spine assets to be loaded
     * @see setPrefix
     * @see loadAll
     * @param {string} atlas
     * @param {string} skel
     * @example
     * // load spine assets
     * Spine.assetManager.setPrefix("data/spine/");
     * Spine.assetManager.loadAsset("alien.atlas", "alien-ess.json");
     * await Spine.assetManager.loadAll();
     */
    loadAsset(atlas, skel) {
        if (atlas) {
            this.asset_manager.loadTextureAtlas(atlas);
        }

        if (skel.endsWith(".skel")) {
            this.asset_manager.loadBinary(skel);
        } else {
            this.asset_manager.loadText(skel);
        }
    }

    /**
     * load all defined spine assets
     * @see loadAsset
     */
    loadAll() {
        return this.asset_manager.loadAll();
    }
}
