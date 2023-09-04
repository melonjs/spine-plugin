import { Math, Renderable, Vector2d, video, loader, utils } from "melonjs";
import * as spineWebGL from "@esotericsoftware/spine-webgl";
import * as spineCanvas from "@esotericsoftware/spine-canvas";
import { Vector2 } from "@esotericsoftware/spine-core";

import AssetManager from "./AssetManager.js";
import SkeletonRenderer from "./SkeletonRenderer.js";

export let assetManager = new AssetManager();

// a custom Spine parser for melonJS preloader
function spineParser(data, onload, onerror) {

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
            assetManager.asset_manager.loadTextureAtlas(filename, onload, onerror);
            break;
        case "json":
            assetManager.asset_manager.loadText(filename, onload, onerror);
            break;
        case "skel":
            assetManager.asset_manager.loadBinary(filename, onload, onerror);
            break;
        default:
            throw "Spine plugin: unknown extension when preloading spine assets";
    }

    return 1;
}

// set the spine custom parser
loader.setParser("spine", spineParser);

/**
 * @classdesc
 * An object to display a Spine animated skeleton on screen.
 * @augments Renderable
 */
export default class Spine extends Renderable {
    runtime;
    skeleton;
    animationState;
    skeletonRenderer;
    assetManager;
    root;
    boneOffset;
    boneSize;

    /**
     * @param {number} x - the x coordinates of the Spine object
     * @param {number} y - the y coordinates of the Spine object
     * @param {object} settings - Configuration parameters for the Spine object
     * @param {number} [settings.atlasFile] - the name of the atlasFile to be used to create this spine animation
     * @param {number} [settings.jsonFile] - the name of the atlasFile to be used to create this spine animation
     * @param {number} [settings.mixTime = 0.2] - the default mix duration to use when no mix duration has been defined between two animations.
     * @example
    * import * as Spine from '@melonjs/spine-plugin';
    * import * as me from 'melonjs';
    *
    * // prepare/declare assets for the preloader
    * const DataManifest = [
    *     {
    *         "name": "alien-ess.json",
    *         "type": "spine",
    *         "src": "data/spine/alien-ess.json"
    *     },
    *     {
    *         "name": "alien.atlas",
    *         "type": "spine",
    *         "src": "data/spine/alien.atlas"
    *     },
    * ]
    *
    * // create a new Spine Renderable
    * let spineAlien = new Spine(100, 100, {atlasFile: "alien.atlas", jsonFile: "alien-ess.json"});
    *
    * // set default animation
    * spineAlien.setAnimation(0, "death", true);
    *
    * // add it to the game world
    * me.game.world.addChild(spineAlien);
    */
    constructor(x, y, settings) {
        super(x, y, settings.width, settings.height);

        if (video.renderer.WebGLVersion >= 1) {
            this.runtime = spineWebGL;
        } else {
            this.runtime = spineCanvas;
        }

        this.assetManager = assetManager.asset_manager;
        this.skeletonRenderer = new SkeletonRenderer(this.runtime);

        // force anchorPoint to 0,0
        this.anchorPoint.set(0, 0);

        // displaying order
        if (typeof settings.z !== "undefined") {
            this.pos.z = settings.z;
        }

        // use internally when calulcating bounds
        this.boneOffset = new Vector2();
        this.boneSize = new Vector2();

        // default mixTime
        this.mixTime = typeof settings.mixTime !== "undefined" ? settings.mixTime :  0.2;


        if (settings.jsonFile) {
            this.jsonFile = settings.jsonFile;
            this.atlasFile = settings.atlasFile;
            this.setSkeleton(this.atlasFile, this.jsonFile);
        }
    }

    /**
     * Whether to enabler the debug mode when rendering the spine object
     * @default false
     * @type {boolean}
     */
    get debugRendering() {
        return this.skeletonRenderer.debugRendering;
    }

    set debugRendering(value) {
        this.skeletonRenderer.debugRendering = value;
    }

    /**
     * set and load the given skeleton atlas and json definition files
     * (use this if you did not specify any json or atlas through the constructor)
     * @param {number} [atlasFile] - the name of the atlasFile to be used to create this spine animation
     * @param {number} [jsonFile] - the name of the atlasFile to be used to create this spine animation
     * @example
     * // create a new Spine Renderable
     * let spineAlien = new Spine(100, 100);
     *
     * // set the skeleton
     * spineAlien.setSkeleton("alien.atlas", "alien-ess.json");
     *
     * // set default animation
     * spineAlien.setAnimation(0, "death", true);
     *
     * // add it to the game world
     * me.game.world.addChild(spineAlien);
     */
    setSkeleton(atlasFile, jsonFile) {
        // Create the texture atlas and skeleton data.
        let atlas = this.assetManager.require(atlasFile);
        let atlasLoader = new this.runtime.AtlasAttachmentLoader(atlas);
        let skeletonJson = new this.runtime.SkeletonJson(atlasLoader);
        let skeletonData = skeletonJson.readSkeletonData(this.assetManager.require(jsonFile));

        // Instantiate a new skeleton based on the atlas and skeleton data.
        this.skeleton = new this.runtime.Skeleton(skeletonData);
        this.skeleton.setToSetupPose();
        this.skeleton.updateWorldTransform();

        // Setup an animation state with a default mix of 0.2 seconds.
        var animationStateData = new this.runtime.AnimationStateData(this.skeleton.data);
        animationStateData.defaultMix = this.mixTime;
        this.animationState = new this.runtime.AnimationState(animationStateData);

        // get a reference to the root bone
        this.root = this.skeleton.getRootBone();
        // Spine uses Y-up, melonJS uses Y-down
        this.root.scaleY *= -1;

        // mark the object as dirty
        this.isDirty = true;
    }

     /**
     * Rotate this Spine object by the specified angle (in radians).
     * @param {number} angle - The angle to rotate (in radians)
     * @param {Vector2d|ObservableVector2d} [v] - an optional point to rotate around
     * @returns {Spine} Reference to this object for method chaining
     */
    rotate(angle, v) {
        // rotation for rootBone is in degrees (anti-clockwise)
        this.skeleton.getRootBone().rotation -= Math.radToDeg(angle) + 90;
        // melonJS rotate method takes radians
        return super.rotate(angle, v);
    }

     /**
     * scale the Spine object around his anchor point.  Scaling actually applies changes
     * to the currentTransform member wich is used by the renderer to scale the object
     * when rendering.  It does not scale the object itself.  For example if the renderable
     * is an image, the image.width and image.height properties are unaltered but the currentTransform
     * member will be changed.
     * @param {number} x - a number representing the abscissa of the scaling vector.
     * @param {number} [y=x] - a number representing the ordinate of the scaling vector.
     * @returns {Spine} Reference to this object for method chaining
     */
    scale(x, y = x) {
        // untested
        return super.scale(x, y);
    }

    /**
     * update the bounding box for this spine object.
     * (this will automatically update the bounds of the entire skeleton animation)
     * @param {boolean} [absolute=true] - update the bounds size and position in (world) absolute coordinates
     * @returns {Bounds} this shape bounding box Rectangle object
     */
    updateBounds(absolute = true) {
        if (this.isRenderable) {
            let bounds = this.getBounds();
            let isIdentity = this.autoTransform === true && this.currentTransform.isIdentity();

            bounds.clear();

            if (typeof this.skeleton !== "undefined") {
                let rootBone = this.skeleton.getRootBone();
                let boneOffset = this.boneOffset;
                let boneSize = this.boneSize;

                this.skeleton.getBounds(boneOffset, boneSize);

                bounds.addFrame(
                    boneOffset.x - rootBone.x,
                    boneOffset.y - rootBone.y,
                    boneSize.x + boneOffset.x - rootBone.x,
                    boneSize.y + boneOffset.y  - rootBone.y,
                    !isIdentity ? this.currentTransform : undefined
                );
            } else {
                bounds.addFrame(
                    0,
                    0,
                    this.width,
                    this.height,
                    !isIdentity ? this.currentTransform : undefined
                );
            }

            if (absolute === true) {
                var absPos = this.getAbsolutePosition();
                bounds.centerOn(absPos.x + bounds.centerX,  absPos.y + bounds.centerY);
            }
            return bounds;

        } else {
            // manage the case where updateBounds is called
            // before the object being yet properly initialized
            return super.updateBounds(absolute);
        }
    }

    /**
     * update function (automatically called by melonJS).
     * @param {number} dt - time since the last update in milliseconds.
     * @returns {boolean} true if the renderable is dirty
     */
    update(dt) {
        if (typeof this.skeleton !== "undefined") {
            let rootBone = this.skeleton.getRootBone();

            // update the root bone position
            if (rootBone.x !== this.pos.x) {
                rootBone.x = this.pos.x;
            }
            if (rootBone.y !== this.pos.y) {
                rootBone.y = this.pos.y;
            }

            // Update and apply the animation state, update the skeleton's
            // world transforms and render the skeleton.
            this.animationState.update(dt / 1000);
            this.animationState.apply(this.skeleton);
            this.skeleton.updateWorldTransform();

            this.updateBounds();
        }
        return true;
    }


    /**
     * draw this spine object
     * @param {CanvasRenderer|WebGLRenderer} renderer - a renderer instance
     * @param {Camera2d} [viewport] - the viewport to (re)draw
     */
    draw(renderer) {
        this.skeletonRenderer.draw(renderer, this.skeleton);
    }

    /**
     * Sets the current animation for a track, discarding any queued animations.
     * @param {number} [track_index] -  If the formerly current track entry was never applied to a skeleton, it is replaced (not mixed from). In either case trackEnd determines when the track is cleared.
     * @param {number} [index] - the animation index
     * @param {boolean} [loop= false] - If true, the animation will repeat. If false it will not, instead its last frame is applied if played beyond its duration.
     * @returns A track entry to allow further customization of animation playback. References to the track entry must not be kept after the dispose event occurs.
     */
    setAnimationByIndex(track_index, index, loop = false) {
        if (index < 0 || index >= this.skeleton.data.animations.length) {
            return (console.log("Animation Index not found"));
        } else {
            this.animationState.setAnimation(track_index, this.skeleton.data.animations[index].name, loop);
        }
    }

    /**
     * Sets the current animation for a track, discarding any queued animations.
     * @param {number} [track_index] -  If the formerly current track entry was never applied to a skeleton, it is replaced (not mixed from). In either case trackEnd determines when the track is cleared.
     * @param {string} [name] - the animation name
     * @param {boolean} [loop= false] - If true, the animation will repeat. If false it will not, instead its last frame is applied if played beyond its duration.
     * @returns A track entry to allow further customization of animation playback. References to the track entry must not be kept after the dispose event occurs.
     * @example
     * // set the current animation
     * spineAlien.setAnimation(0, "death", true);
     */
    setAnimation(track_index, name, loop = false) {
        this.animationState.setAnimation(track_index, name, loop);
    }

    /**
     * Adds an animation to be played after the current or last queued animation for a track, and sets the track entry's mixDuration.
     * @param {number} [delay=0] - If > 0, sets delay. If <= 0, the delay set is the duration of the previous track entry minus any mix duration plus the specified `delay` (ie the mix ends at (`delay` = 0) or before (`delay` < 0) the previous track entry duration). If the previous entry is looping, its next loop completion is used instead of its duration.
     * @return A track entry to allow further customization of animation playback. References to the track entry must not be kept after the dispose} event occurs.
     */
    addAnimationByIndex(track_index, index, loop = false, delay = 0) {
        if (index < 0 || index >= this.skeleton.data.animations.length) {
            return (console.log("Animation Index not found"));
        } else {
            this.animationState.addAnimation(track_index, this.skeleton.data.animations[index].name, loop, delay);
        }
    }

    addAnimationByName(track_index, animationName, loop = false, delay = 0) {
        this.animationState.addAnimation(track_index, animationName, loop, delay);
    }

    getSpinePosition() {
        return new Vector2d(this.pos.x, this.pos.y);
    }

    setSpineSize(width, height) {
        this.width = width;
        this.height = height;
    }

    getSpineSize() {
        return {
            width: this.width,
            height: this.height
        };
    }

    /**
     * Set the default mix duration to use when no mix duration has been defined between two animations.
     * @param {number} mixTime
     */
    setDefaultMixTime(mixTime) {
        this.animationState.data.defaultMix = this.mixTime = mixTime;
    }

    /**
     * Sets a mix duration by animation name.
     */
    setTransitionMixTime(firstAnimation, secondAnimation, mixTime) {
        this.animationState.setMix(firstAnimation, secondAnimation, mixTime);
    }

    /**
     * Sets a skin by name.
     * @param {string} skinName
     * @example
     * // create a new Spine Renderable
     * let spineAlien = new Spine(100, 100, {atlasFile: "mix-and-match-pma.atlas", jsonFile: "mix-and-match-pro.json"});
     *
     * // set default animation
     * spineAlien.setAnimation(0, "dance", true);
     *
     * // set default skin
     * spineAlien.setSkinByName("full-skins/girl");
     *
     * // add it to the game world
     * me.game.world.addChild(spineAlien);
     */
    setSkinByName(skinName) {
        this.skeleton.setSkinByName(skinName);
    }

    /**
     * Sets this slot to the setup pose.
     */
    setToSetupPose() {
        this.skeleton.setToSetupPose();
    }
}
