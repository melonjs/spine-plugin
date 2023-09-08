import { event } from "melonjs";
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
        event.once(event.VIDEO_INIT, (renderer) => {
            this.pathPrefix = pathPrefix;
            if (renderer.WebGLVersion >= 1) {
                this.asset_manager = new spineWebGL.AssetManager(renderer.getContext(), this.pathPrefix);
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
     * // "manually" load spine assets
     * Spine.assetManager.setPrefix("data/spine/");
     * Spine.assetManager.loadAsset("alien.atlas", "alien-ess.json");
     * await Spine.assetManager.loadAll();
     */
    loadAsset(atlas, skel) {
        if (atlas) {
            this.loadTextureAtlas(atlas);
        }

        if (skel.endsWith(".skel")) {
            this.loadBinary(skel);
        } else {
            this.loadText(skel);
        }
    }

    /**
     * load the given texture atlas
     * @param {string} atlas
     */
    loadTextureAtlas(atlas, onload, onerror) {
        return this.asset_manager.loadTextureAtlas(atlas, onload, onerror);
    }


    /**
     * load the given skeleton .skel file
     * @param {string} skel
     */
    loadBinary(skel, onload, onerror) {
        return this.asset_manager.loadBinary(skel, onload, onerror);
    }

    /**
     * load the given skeleton binary file
     * @param {string} skel
     */
    loadText(skel, onload, onerror) {
        return this.asset_manager.loadText(skel, onload, onerror);
    }

    /**
     * load all defined spine assets
     * @see loadAsset
     */
    loadAll() {
        return this.asset_manager.loadAll();
    }

    /**
     * get the loaded skeleton data
     * @param {string} path
     */
    require(path) {
        return this.asset_manager.require(path);
    }
}

export let assetManager = new AssetManager();
