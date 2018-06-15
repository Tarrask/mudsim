<template>
<div>
  <h1>A bike riding in mud simulator</h1>
  <div id="controls">
    <button @click="restart">Restart entrance</button>
    <input type="range" min="0" max="100" v-model="speed">
  </div>

  <div ref="game"></div>
</div>
</template>

<script>

export default {
  data() {
    return {
      speed: 10
    };
  },
  mounted() {
    let { utils, Application } = this.$pixi;
    let type = 'WebGL';
    if(!utils.isWebGLSupported()) {
      type = 'canvas';
    }

    utils.sayHello(type);

    this.pixiApp = new Application({ 
      width: 800, 
      height: 600,
      autoResize: true, 
      antialias: true,
      transparent: false,
      resolution: 1 
    });
    this.$refs.game.appendChild(this.pixiApp.view);

    this.pixiApp.renderer.backgroundColor = 0x888888;
    this.pixiLoader = new this.$pixi.loaders.Loader();

    // load assets
    this.pixiLoader.add('wholeBike.jpg');
    this.pixiLoader.add('wheel', 'wheel.png');
    this.pixiLoader.add('frame', 'frame.png');
    this.pixiLoader.add('sky', 'sky@4x.jpg');
    this.pixiLoader.add('mud1', 'mud1.png');
    this.pixiLoader.add('ground', 'ground.png');
    this.$nextTick(() => {
      this.pixiLoader.load(this.setup);
      this.pixiLoader.on('progress', (loader) => {
        console.log('loading (' + loader.progress + '%)');
        this.$nuxt.$loading.increase(loader.progress);
      });
      this.$nuxt.$loading.start();
    });
  },
  methods: {
    setup() {
      console.log('images loaded');
      this.$nuxt.$loading.finish();
      const { Sprite, particles: { ParticleContainer }, Graphics, Polygon, extras: { TilingSprite } } = this.$pixi;
      //const TilingSprite = this.$pixi.extras.TilingSprite;
      const app = this.pixiApp;
      const resources = this.pixiLoader.resources;
      //this.bike = new Sprite(resources['wholeBike.jpg'].texture);

      // initialise les Sprites necessaires au simulateur
      const sky = new Sprite(resources['sky'].texture);
      sky.position.set(0, 0);
      sky.width = 800;
      sky.height = 600;

      this.frontWheel = new Sprite(resources['wheel'].texture);
      this.frontWheel.anchor.set(0.5, 0.5);
      this.frontWheel.position.set(570, 450);

      this.backWheel = new Sprite(resources['wheel'].texture);
      this.backWheel.anchor.set(0.5, 0.5);
      this.backWheel.position.set(230, 450);

      this.frame = new Sprite(resources['frame'].texture);
      this.frame.anchor.set(0.5, 0.5);
      this.frame.position.set(400, 365);
      this.frame.interactive = true;
      this.frame.buttonMode = true;
      let points = [279.6, 49.9, 250.5, 68.5, 180, 210.8, 164, 226.8, 135.4, 223.7, 118, 208, 102, 145, 109.9, 109.1, 84.7, 27.6, 50.7, 12.2, 50, 9, 130.1, 8.6, 131.7, 12.6, 111.1, 12.2, 93.7, 26.4, 116, 96, 142.3, 97.3, 267.9, 25.2];
      //let points = [ 0, 0, 200, 0, 200, 200, 0, 200 ];
      for(let i = 0, l = points.length; i < l; i+=2) {
        points[i] += -180;
        points[i+1] += -113;
      }
      console.log(points);
      this.frame.hitArea = new Polygon(points);

      let points2 = [279.6, 49.9, 250.5, 68.5, 180, 210.8, 164, 226.8, 135.4, 223.7, 118, 208, 102, 145, 109.9, 109.1, 84.7, 27.6, 50.7, 12.2, 50, 9, 130.1, 8.6, 131.7, 12.6, 111.1, 12.2, 93.7, 26.4, 116, 96, 142.3, 97.3, 267.9, 25.2];
      for(let i = 0, l = points2.length; i < l; i+=2) {
        points2[i] += 400 - 180;
        points2[i+1] += 365 - 113;
      }
      const graphics = new Graphics();
      graphics.beginFill(0xFF3300);
      graphics.drawShape(new Polygon(points2));
      this.frameHitArea = new Polygon(points2);

      this.bike = new Sprite(resources['wholeBike.jpg'].texture);
      this.bike.anchor.set(0.5, 1);
      this.bike.position.set(400, 550);
      this.bike.scale.x = -1;

      this.groundTiles = new TilingSprite(resources['ground'].texture, 800, 64);
      this.groundTiles.position.set(0, 600-64);

      this.mudContainer = new ParticleContainer(16000);

      // construit le stage graph
      app.stage.addChild(sky);
      app.stage.addChild(this.frontWheel);
      app.stage.addChild(this.backWheel);
      app.stage.addChild(this.frame);
      app.stage.addChild(this.mudContainer);
      app.stage.addChild(this.groundTiles);
      // app.stage.addChild(graphics);

      // démarre le jeu
      this.entranceSetup();
      this.play = this.entranceLoop;
      app.ticker.add(delta => this.play(delta));
    },
    entranceSetup() {
      this.entranceTimeline = new TimelineMax({
        onComplete() {
          this.play = this.gameLoop;
        },
        onCompleteScope: this
      });
      this.frontWheel.va = this.speed * 0.002;
      this.backWheel.va = this.speed * 0.002;
      this.entranceTimeline.from(this.frontWheel, 2, { x: -105, va: 0.1 }, 0);
      this.entranceTimeline.from(this.frontWheel, 2, { y: 100, ease: Bounce.easeOut }, 0);
      this.entranceTimeline.add('backWheelEntrance', 0.4);
      this.entranceTimeline.from(this.backWheel, 1.6, { x: -105, va: 0.1 }, 'backWheelEntrance');
      this.entranceTimeline.from(this.backWheel, 1.6, { y: 300, ease: Bounce.easeOut }, 'backWheelEntrance');
      this.entranceTimeline.add('frameEntrance', 1.4);
      this.entranceTimeline.from(this.frame, 0.3, { y: -150, ease: Linear.easeNone }, 'frameEntrance');
      this.entranceTimeline.from(this.frame, 0.3, { x: 600 }, 'frameEntrance');
    },
    entranceLoop(delta) {
      this.frontWheel.rotation += this.frontWheel.va;
      this.backWheel.rotation += this.backWheel.va;
    },
    gameLoop(delta) {
      const { Sprite } = this.$pixi;
      const app = this.pixiApp;
      const resources = this.pixiLoader.resources;
      const va = this.speed * 0.002;
      const vx = va * 102;

      // génère de la boue :)
      for(let i = 0; i < 10; i++) {
        let mud = new Sprite(resources['mud1'].texture);
        mud.anchor.set(0.5, 0.5);
        if(Math.random() > 0.5) {
          mud.cx = 230;
          mud.cy = 450;
        }
        else {
          mud.cx = 570;
          mud.cy = 450;
        }
        mud.r = 102 + Math.random() * 2;
        mud.angle = (Math.PI / 2) + (Math.random() * 0.1 - 0.05);
        mud.born = app.ticker.lastTime;
        mud.state = 0;
        this.mudContainer.addChild(mud);
      }

      // on fait bouger la boue
      // console.log(this.mudContainer.children.length);
      this.mudContainer.children.forEach(mud => {
        if(app.ticker.lastTime - mud.born > 100000) {
          // console.log('removing mud due to old age');
          this.mudContainer.removeChild(mud);
        }
        else if(mud.x < -10 || mud.x > 810 || mud.y > 610) {
          // console.log('removing mud due to out of screen');
          this.mudContainer.removeChild(mud);
        }
        else {
          switch(mud.state) {
            case 0:
              mud.angle += va;
              mud.position.set(mud.cx + Math.cos(mud.angle) * mud.r, mud.cy + Math.sin(mud.angle) * mud.r);
              if(Math.random() * 200 < mud.r * va * va) {
                mud.state = 1;

                mud.vx = va * mud.r * -Math.sin(mud.angle) + vx;
                mud.vy = va * mud.r * Math.cos(mud.angle);
              }
              break;
            case 1:
              let deltaVx = mud.vx - vx;
              mud.vy += 0.0981;
              mud.vx += mud.vx * mud.vx * -0.001;
              mud.x += mud.vx - vx;
              mud.y += mud.vy;
              if(this.frameHitArea.contains(mud.x, mud.y)) {
                // console.log('mud hit frameHitArea');
                mud.state = 2;
              }
              break;
            case 2:
              break;
          }
        }
      });

      // on fait tourner les roues
      this.frontWheel.rotation += va;
      this.backWheel.rotation += va;

      // on bouge le sol
      this.groundTiles.tilePosition.x -= vx;
    },
    restart() {
      this.$ga.event('controls', 'restart');

      // réinitialise la boue
      this.mudContainer.removeChildren();

      this.entranceSetup();
      this.play = this.entranceLoop;
    }
  }
};
</script>
