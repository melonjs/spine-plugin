import { event, video } from "melonjs";
import * as spineWebGL from "@esotericsoftware/spine-webgl";
import * as spineCanvas from "@esotericsoftware/spine-canvas";

export default class AssetManager {
    asset_manager;
    pathPrefix;

    constructor(pathPrefix = "") {
        event.once(event.VIDEO_INIT, this.initAssetManager.bind(this));
        this.pathPrefix = pathPrefix;
    }

    initAssetManager() {
        if (video.renderer.WebGLVersion >= 1) {
            this.asset_manager = new spineWebGL.AssetManager(video.renderer.getContext(), this.pathPrefix);
        } else {
            // canvas renderer
            this.asset_manager = new spineCanvas.AssetManager(this.pathPrefix);
        }
    }

    setPrefix(pathPrefix) {
        this.asset_manager.pathPrefix = pathPrefix;
    }

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

    loadAll() {
        return this.asset_manager.loadAll();
    }
}
