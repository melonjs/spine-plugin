import { Color as MColor, Math as MMath } from "melonjs";
import { RegionAttachment, Color } from "@esotericsoftware/spine-core";

const worldVertices = new Float32Array(8);
const blendModeLUT = ["normal", "additive", "multiply", "screen"];

export default class SkeletonRenderer {
    isWebGLRenderer;
    skeletonRenderer;
    runtime;
    tempColor = new Color();
    tintColor = new MColor();
    debugRendering = false;

    constructor(runtime) {
        this.runtime = runtime;
        this.skeletonRenderer = new runtime.SkeletonRenderer();
        this.tempColor = new Color();
    }

    draw(renderer, skeleton) {
        // based on https://github.com/EsotericSoftware/spine-runtimes/blob/4.1/spine-ts/spine-canvas/src/SkeletonRenderer.ts
        let drawOrder = skeleton.drawOrder;
        let skeletonColor = skeleton.color;

        if (this.debugRendering === true) {
            renderer.setColor("green");
        }

        for (var i = 0, n = drawOrder.length; i < n; i++) {
            let slot = drawOrder[i];
            let bone = slot.bone;

            if (!bone.active) continue;

            let attachment = slot.getAttachment();

            if (attachment instanceof RegionAttachment) {
                let region = attachment.region;
                let image = region.texture.getImage();
                let slotColor = slot.color;
                let regionColor = attachment.color;
                let blendMode = slot.data.blendMode;
                let color = this.tintColor;

                color.setFloat(skeletonColor.r * slotColor.r * regionColor.r,
                    skeletonColor.g * slotColor.g * regionColor.g,
                    skeletonColor.b * slotColor.b * regionColor.b,
                    skeletonColor.a * slotColor.a * regionColor.a);

                attachment.computeWorldVertices(slot, worldVertices, 0, 2);

                renderer.save();
                renderer.transform(bone.a, bone.c, bone.b, bone.d, bone.worldX, bone.worldY);
                renderer.translate(attachment.offset[0], attachment.offset[1]);
                renderer.rotate(MMath.degToRad(attachment.rotation));

                let atlasScale = attachment.width / region.originalWidth;
                renderer.scale(atlasScale * attachment.scaleX, atlasScale * attachment.scaleY);

                let w = region.width, h = region.height;
                let hW = w / 2, hH = h / 2;
                renderer.translate(hW, hH);
                if (region.degrees === 90) {
                    let t = w;
                    w = h;
                    h = t;
                    renderer.rotate(-MMath.ETA);
                }
                renderer.scale(1, -1);
                renderer.translate(-hW, -hH);
                renderer.setTint(color);
                renderer.setBlendMode(blendModeLUT[blendMode]);
                renderer.setGlobalAlpha(color.a);
                renderer.drawImage(image, image.width * region.u, image.height * region.v, w, h, 0, 0, w, h);
                if (this.debugRendering === true) {
                    renderer.strokeRect(0, 0, w, h);
                }
                renderer.restore();
            }
        }
    }
}
