
import { utils } from "melonjs";
import { assetManager } from "./AssetManager.js";

// a custom Spine parser for the melonJS preloader
export function spineParser(data, onload, onerror) {

    // decompose data.src for the spine loader
    const ext = utils.file.getExtension(data.src);
    const basename = utils.file.getBasename(data.src);
    const path = utils.file.getPath(data.src);
    const filename = basename + "." + ext;

    // set url prefix
    assetManager.setPrefix(path);

    // load asset
    switch (ext) {
        case "atlas":
            assetManager.loadTextureAtlas(filename, onload, onerror);
            break;
        case "json":
            assetManager.loadText(filename, onload, onerror);
            break;
        case "skel":
            assetManager.loadBinary(filename, onload, onerror);
            break;
        default:
            throw "Spine plugin: unknown extension when preloading spine assets";
    }

    return 1;
}
