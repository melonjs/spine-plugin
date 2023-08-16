import { Math, Renderable, Vector2d, video } from "melonjs";

import * as spineWebGL from "@esotericsoftware/spine-webgl";
import * as spineCanvas from "@esotericsoftware/spine-canvas";
import { Vector2 } from "@esotericsoftware/spine-core";

import AssetManager from "./AssetManager.js";
import SkeletonRenderer from "./SkeletonRenderer.js";

export let assetManager = new AssetManager();

export default class Spine extends Renderable {
    runtime;
    skeleton;
    animationState;
    skeletonRenderer;
    assetManager;
    root;
    boneOffset;
    boneSize;

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

        this.scaleValue = {x: 1, y: 1};
        this.boneOffset = new Vector2();
        this.boneSize = new Vector2();

        this.mixTime = settings.mixTime || 0.2;

        if (settings.jsonFile) {
            this.jsonFile = settings.jsonFile;
            this.atlasFile = settings.atlasFile;

            this.setSkeleton(this.atlasFile, this.jsonFile);
        }
    }

    setSkeleton(atlasFile, jsonFile) {
        this.loadSpineAssets(atlasFile, jsonFile);
        this.root = this.skeleton.getRootBone();
    }

    loadSpineAssets(atlasFile, jsonFile) {
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
    }

    rotate(angle, v) {
        // rotation for rootBone is in degrees (anti-clockwise)
        this.skeleton.getRootBone().rotation -= Math.radToDeg(angle) + 90;
        // melonJS rotate method takes radians
        super.rotate(angle, v);
    }

    scale(x, y = x) {
        this.scaleValue = {x, y};
        super.scale(x, y);
    }

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
    update(dt) { // eslint-disable-line no-unused-vars
        if (typeof this.skeleton !== "undefined") {
            let rootBone = this.skeleton.getRootBone();

            // update the root bone position
            if (rootBone.x !== this.pos.x) {
                rootBone.x = this.pos.x;
            }
            if (rootBone.y !== this.pos.y) {
                rootBone.y = this.pos.y;
            }

            this.skeletonRenderer.updateSkeleton(rootBone);
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
     * @name draw
     * @memberof Spine
     * @protected
     * @param {CanvasRenderer|WebGLRenderer} renderer - a renderer instance
     * @param {Camera2d} [viewport] - the viewport to (re)draw
     */
    draw(renderer) {
        this.skeletonRenderer.draw(renderer, this.skeleton);
    }


    setAnimationByIndex(track_index, index, loop = false) {
        if (index < 0 || index >= this.skeleton.data.animations.length)
            { return (console.log("Animation Index not found")); }
        else
            { this.animationState.setAnimation(track_index, this.skeleton.data.animations[index].name, loop); }
    }

    setAnimation(track_index, name, loop = false) {
        this.animationState.setAnimation(track_index, name, loop);
    }

    addAnimationByIndex(track_index, index, loop = false, delay = 0) {
        if (index < 0 || index >= this.skeleton.data.animations.length)
            { return (console.log("Animation Index not found")); }
        else
            { this.animationState.addAnimation(track_index, this.skeleton.data.animations[index].name, loop, delay); }
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

    setDefaultMixTime(mixTime) {
        this.animationState.data.defaultMix = mixTime;
    }

    setTransitionMixTime(firstAnimation, secondAnimation, mixTime) {
        this.animationState.setMix(firstAnimation, secondAnimation, mixTime);
    }

    setSkinByName(skinName) {
        this.skeleton.setSkinByName(skinName);
    }

    setToSetupPose() {
        this.skeleton.setToSetupPose();
    }
}
