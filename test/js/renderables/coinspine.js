import * as me from 'melonjs';
import game from '../game.js'


import Spine from 'spinePlugin'

export default class CoinSpine extends Spine {
	constructor(x, y, settings = {}){
		super(x, y, Object.assign(settings));

		// add a physic body
		this.body = new me.Body(this);
		var bodyShapePos = {x: (this.anchorPoint.x * this.width), y:(this.anchorPoint.y * this.height)}
		this.body.addShape(me.pool.pull("me.Rect", 0 - bodyShapePos.y, 0 - bodyShapePos.y, this.width, this.height) );
		this.body.collisionType = me.collision.types.ENEMY_OBJECT;
		this.body.setCollisionMask(me.collision.types.ALL_OBJECT);
		this.body.gravityScale = 0;
		this.isKinematic = false;

		// rotate the object when clicking within the object bounds
		me.input.registerPointerEvent("pointerdown", this, ()=> {
			this.rotate(1.5707970000000002);
		});
	}

	update(dt) {
		// call the parent update method
		super.update(dt);

		// update the body size to match with the spine object bounds
		if (this.body) {
			let bounds = this.getBounds();
			let w = bounds.width;
			let h = bounds.height;
			this.body.setVertices([
				{x: 0, y: 0}, // 0, 0
				{x: w, y: 0}, // 1, 0
				{x: w, y: h}, // 1, 1
				{x: 0, y: h}, // 0, 1
			]);
		}
		
		return true;
	}
};
