/* 
	Parcycle: by Mr Speaker - www.mrspeaker.net
	v: 1.0
	license: MIT
	
	Particle Emitter classes based on the code from 71squared.com iPhone tutorials
	
	includes:
		cParticle : class for individual particles
		cParticleSystem : the controller for the particles
		Vector : a vector helper object
*/

// Individual particle
function cParticle(){
	this.position = Vector.create();
	this.direction = Vector.create();
	this.size = 0;
	this.sizeSmall = 0;
	this.timeToLive = 0;
	this.colour = [];
	this.drawColour = "";
	this.deltaColour = [];
	this.sharpness = 0;
}

// The particle emitter.
function cParticleSystem(){
	this.maxParticles = 150;
	this.particles = [];
	this.active = true;

	// Properties
	this.position = Vector.create( 100, 100 );
	this.positionRandom = Vector.create( 10, 10 );
	this.size = 45;
	this.sizeRandom = 15;
	this.speed = 5;
	this.speedRandom = 1.5;
	this.lifeSpan = 9;
	this.lifeSpanRandom = 7;
	this.angle = 0;
	this.angleRandom = 360;
	this.gravity = Vector.create( 0.4, 0.2 );
	this.startColour = [ 250, 218, 68, 1 ];
	this.startColourRandom = [ 62, 60, 60, 0 ];
	this.endColour = [ 245, 35, 0, 0 ];  
	this.endColourRandom = [ 60, 60, 60, 0 ];
	this.sharpness = 40;
	this.sharpnessRandom = 10;

	this.particleCount = 0;
	this.elapsedTime = 0;
	this.duration = -1;
	this.emissionRate = 0;
	this.emitCounter = 0;
	this.particleIndex = 0;
	
	this.init = function(){
		this.emissionRate = this.maxParticles / this.lifeSpan;
		this.emitCounter = 0;
	};
	
	this.addParticle = function(){
		if(this.particleCount == this.maxParticles) {
			return false;
		}
		
		// Take the next particle out of the particle pool we have created and initialize it	
		var particle = new cParticle();
		this.initParticle( particle );
		this.particles[ this.particleCount ] = particle;
		// Increment the particle count
		this.particleCount++;

		return true;
	};
	
	this.initParticle = function( particle ){
		var RANDM1TO1 = function(){ return Math.random() * 2 - 1; };
		
		particle.position.x = this.position.x + this.positionRandom.x * RANDM1TO1();
		particle.position.y = this.position.y + this.positionRandom.y * RANDM1TO1();

		var newAngle = (this.angle + this.angleRandom * RANDM1TO1() ) * ( Math.PI / 180 ); // convert to radians
		var vector = Vector.create( Math.cos( newAngle ), Math.sin( newAngle ) ); // Could move to lookup for speed
		var vectorSpeed = this.speed + this.speedRandom * RANDM1TO1();
		particle.direction = Vector.multiply( vector, vectorSpeed );

		particle.size = this.size + this.sizeRandom * RANDM1TO1();
		particle.size = particle.size < 0 ? 0 : ~~particle.size;
		particle.timeToLive = this.lifeSpan + this.lifeSpanRandom * RANDM1TO1();
		
		particle.sharpness = this.sharpness + this.sharpnessRandom * RANDM1TO1();
		particle.sharpness = particle.sharpness > 100 ? 100 : particle.sharpness < 0 ? 0 : particle.sharpness;
		// internal circle gradient size - affects the sharpness of the radial gradient
		particle.sizeSmall = ~~( ( particle.size / 200 ) * particle.sharpness ); //(size/2/100)

		var start = [
			this.startColour[ 0 ] + this.startColourRandom[ 0 ] * RANDM1TO1(),
			this.startColour[ 1 ] + this.startColourRandom[ 1 ] * RANDM1TO1(),
			this.startColour[ 2 ] + this.startColourRandom[ 2 ] * RANDM1TO1(),
			this.startColour[ 3 ] + this.startColourRandom[ 3 ] * RANDM1TO1()
		];

		var end = [
			this.endColour[ 0 ] + this.endColourRandom[ 0 ] * RANDM1TO1(),
			this.endColour[ 1 ] + this.endColourRandom[ 1 ] * RANDM1TO1(),
			this.endColour[ 2 ] + this.endColourRandom[ 2 ] * RANDM1TO1(),
			this.endColour[ 3 ] + this.endColourRandom[ 3 ] * RANDM1TO1()
		];

	    particle.colour = start;
		particle.deltaColour[ 0 ] = ( end[ 0 ] - start[ 0 ] ) / particle.timeToLive;
		particle.deltaColour[ 1 ] = ( end[ 1 ] - start[ 1 ] ) / particle.timeToLive;
		particle.deltaColour[ 2 ] = ( end[ 2 ] - start[ 2 ] ) / particle.timeToLive;
		particle.deltaColour[ 3 ] = ( end[ 3 ] - start[ 3 ] ) / particle.timeToLive;
	};
	
	this.update = function( delta ){
		if( this.active && this.emissionRate > 0 ){
			var rate = 1 / this.emissionRate;
			this.emitCounter += delta;
			while( this.particleCount < this.maxParticles && this.emitCounter > rate ){
				this.addParticle();
				this.emitCounter -= rate;
			}
			this.elapsedTime += delta;
			if( this.duration != -1 && this.duration < this.elapsedTime ){
				this.stop();
			}
		}

		this.particleIndex = 0;
		while( this.particleIndex < this.particleCount ) {

			var currentParticle = this.particles[ this.particleIndex ];

			// If the current particle is alive then update it
			if( currentParticle.timeToLive > 0 ){

				// Calculate the new direction based on gravity
				currentParticle.direction = Vector.add( currentParticle.direction, this.gravity );
				currentParticle.position = Vector.add( currentParticle.position, currentParticle.direction );
				currentParticle.timeToLive -= delta;

				// Update colours based on delta
				var r = currentParticle.colour[ 0 ] += ( currentParticle.deltaColour[ 0 ] * delta );
				var g = currentParticle.colour[ 1 ] += ( currentParticle.deltaColour[ 1 ] * delta );
				var b = currentParticle.colour[ 2 ] += ( currentParticle.deltaColour[ 2 ] * delta );
				var a = currentParticle.colour[ 3 ] += ( currentParticle.deltaColour[ 3 ] * delta );
				
				// Calculate the rgba string to draw.
				var r = ( r > 255 ? 255 : r < 0 ? 0 : ~~r ),
				g = ( g > 255 ? 255 : g < 0 ? 0 : ~~g ),
				b = ( b > 255 ? 255 : b < 0 ? 0 : ~~b ),
				a = (a > 1 ? 1 : a < 0 ? 0 : a.toFixed( 2 ) );
				currentParticle.drawColour = 'rgba('+r+','+g+','+b+','+a+')';
				currentParticle.drawColourTransparent = 'rgba('+r+','+g+','+b+',0)';
				
				this.particleIndex++;
			} else {
				// Replace particle with the last active 
				if( this.particleIndex != this.particleCount - 1 ){
					this.particles[ this.particleIndex ] = this.particles[ this.particleCount-1 ];
				}
				this.particleCount--;
			}
		}
	};
	
	this.stop = function(){
		this.active = false;
		this.elapsedTime = 0;
		this.emitCounter = 0;
	};
	
	this.render = function( context ){
		for( var i = 0, j = this.particleCount; i < j; i++ ){
			var particle = this.particles[ i ];
			var size = particle.size;
			var halfSize = size >> 1;
			var x = ~~particle.position.x;
			var y = ~~particle.position.y;
					
			var radgrad = context.createRadialGradient( x + halfSize, y + halfSize, particle.sizeSmall, x + halfSize, y + halfSize, halfSize);  
			radgrad.addColorStop( 0, particle.drawColour );   
			radgrad.addColorStop( 1, particle.drawColourTransparent ); //Super cool if you change these values (and add more colour stops)
			context.fillStyle = radgrad;
		  	context.fillRect( x, y, size, size );
		}
	};	
}

/* Vector Helper */
var Vector = {
	create : function( x, y ){
		return {
			"x" : x || -1,
			"y" : y || -1
		};
	},
	multiply : function( vector, scaleFactor ){
		vector.x *= scaleFactor; 
		vector.y *= scaleFactor;
		return vector;
	},
	add : function( vector1, vector2 ){ 
		vector1.x += vector2.x; 
		vector1.y += vector2.y;
		return vector1;
	}
};

