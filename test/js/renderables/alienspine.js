import * as me from 'melonjs';
import Spine from 'spinePlugin'


export default class AlienSpine extends Spine {
	constructor(x, y, settings ){
		super(x, y, settings);
		
		// add a physic body
		this.body = new me.Body(this);
		this.body.addShape(me.pool.pull("me.Rect", 0, 0, this.width, this.height) );
		this.body.collisionType = me.collision.types.ENEMY_OBJECT;
		this.body.setCollisionMask(me.collision.types.ALL_OBJECT);
		this.body.gravityScale = 0;
		this.isKinematic = false;

		// for testing
		me.input.registerPointerEvent("pointerdown", this, ()=> {
			this.rotate(me.Math.degToRad(90));
		});

		// Default animation
		this.setAnimation(0, "death", true);
	}

	update(dt) {
		// call the parent update method
		super.update(dt);

		// rotate the object when clicking within the object bounds
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
