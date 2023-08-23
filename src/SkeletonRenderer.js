import { Color as MColor, Math as MMath, Polygon } from "melonjs";
import { SkeletonClipping, ClippingAttachment, MeshAttachment, RegionAttachment } from "@esotericsoftware/spine-core";

const worldVertices = new Float32Array(8);
const blendModeLUT = ["normal", "additive", "multiply", "screen"];

const regionDebugColor = "green";
const clipDebugColor = "blue";

export default class SkeletonRenderer {
    skeletonRenderer;
    runtime;
    tintColor = new MColor();
    vertexSize = 2 + 2 + 4;
    debugRendering = false;
    clipper = new SkeletonClipping();
    clippingVertices = [];
    clippingMask = new Polygon(0, 0);

    constructor(runtime) {
        this.runtime = runtime;
        this.skeletonRenderer = new runtime.SkeletonRenderer();
    }

    draw(renderer, skeleton) {
        let clipper = this.clipper;
        let drawOrder = skeleton.drawOrder;
        let skeletonColor = skeleton.color;
        let clippingMask = this.clippingMask;
        let debugRendering = this.debugRendering;

        for (var i = 0, n = drawOrder.length; i < n; i++) {
            let clippedVertexSize = clipper.isClipping() ? 2 : this.vertexSize;
            let slot = drawOrder[i];
            let bone = slot.bone;
            let image;
            let region;

            if (!bone.active) {
                clipper.clipEndWithSlot(slot);
                renderer.clearMask();
                continue;
            }

            let attachment = slot.getAttachment();

            if (attachment instanceof RegionAttachment) {
                attachment.computeWorldVertices(slot, worldVertices, 0, clippedVertexSize);
                region = attachment.region;
                image = region.texture.getImage();
            } else if (attachment instanceof MeshAttachment) {
                /*
                // commenting for now as totally untested
                let mesh = attachment;
                mesh.computeWorldVertices(slot, 0, mesh.worldVerticesLength, worldVertices, 0, 2);
                region = mesh.region;
                image = mesh.region.texture.getImage();
                */
               console.warn("spine-plugin: MeshAttachment is not supported yet");
            } else if (attachment instanceof ClippingAttachment) {
                let clip = attachment;
                let vertices = this.clippingVertices;
                clipper.clipStart(slot, clip);
                clip.computeWorldVertices(slot, 0, clip.worldVerticesLength, vertices, 0, 2);
                clippingMask.setVertices(vertices, clip.worldVerticesLength);
                if (debugRendering === true) {
                    renderer.setColor(clipDebugColor);
                    renderer.stroke(clippingMask);
                }
                continue;
            } else {
                clipper.clipEndWithSlot(slot);
                renderer.clearMask();
                continue;
            }

            if (typeof image !== "undefined") {
                let slotColor = slot.color;
                let regionColor = attachment.color;
                let blendMode = slot.data.blendMode;
                let color = this.tintColor;

                color.setFloat(skeletonColor.r * slotColor.r * regionColor.r,
                    skeletonColor.g * slotColor.g * regionColor.g,
                    skeletonColor.b * slotColor.b * regionColor.b,
                    skeletonColor.a * slotColor.a * regionColor.a);

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

                if (clipper.isClipping()) {
                    renderer.setMask(clippingMask);
                }

                renderer.drawImage(image, image.width * region.u, image.height * region.v, w, h, 0, 0, w, h);

                if (debugRendering === true) {
                    renderer.setColor(regionDebugColor);
                    renderer.strokeRect(0, 0, w, h);
                }

                renderer.restore();
            }
            clipper.clipEndWithSlot(slot);
            renderer.clearMask();
        }
        clipper.clipEnd();
    }
}
