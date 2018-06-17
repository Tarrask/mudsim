<template>
<div>
  <h1>A bike riding in mud simulator</h1>
  <div id="controls">
    <button @click="restart">Restart entrance</button>
    <input type="range" min="0" max="100" v-model="speed">
    <select v-model.number="mudType">
      <option v-for="type in mudTypes" :value="type">{{ type.name }}</option>
    </select>
    <!-- {{ mudCount }} -->
  </div>

  <div class="game" ref="game"></div>
</div>
</template>

<script>
import debounce from 'debounce';

export default {
  data() {
    const mudTypes = [
      { name: 'Brown mud', tint: 0x634100, cx: 0.001 }, 
      { name: 'Ocre mud', tint: 0xB88A00, cx: 0.002 }, 
      { name: 'Snow', tint: 0xffffff, cx: 0.004 }
    ];
    return {
      speed: 10,
      mudTypes,
      mudType: mudTypes[0],
      screenWidth: 0,
      screenHeight: 0,
      mudCount: {
        onWheels: 0,
        flying: 0,
        onBike: 0
      }
    };
  },
  mounted() {
    this.recalculateViewport();
    this.init();

    window.addEventListener('resize', this.recalculateViewport);
    window.addEventListener('orientationchange', this.recalculateViewport);
    window.addEventListener('click', () => { console.log('click'); });
  },
  destroyed() {
    console.log('Destroying pixi application ');
    this.pixiApp.destroy();
    this.$pixi.utils.destroyTextureCache();

    window.removeEventListener('resize', this.recalculateViewport);
    window.removeEventListener('orientationchange', this.recalculateViewport);
  },
  watch: {
    mudType(newVal) {
      console.log(newVal);
      TweenMax.to(this.dirtGroundSprites, 2, { colorProps: {tint: newVal.tint, format: 'number'}, ease:Linear.easeNone });
    }
  },
  methods: {
    recalculateViewport: debounce(() => {
      console.log('recalculating viewport dimensions:', window.innerWidth, window.innerHeight);
      this.screenWidth = window.innerWidth;
      this.screenHeight = window.innerHeight;
    }),
    init() {
      console.log('Creating pixi application');
      let { utils, Application } = this.$pixi;
      let type = 'WebGL';
      if(!utils.isWebGLSupported()) {
        type = 'canvas';
      }

      utils.sayHello(type);

      this.pixiApp = new Application({ 
        width: 1024, 
        height: 576,
        autoResize: false, 
        antialias: true,
        transparent: false,
        resolution: 1,
        clearBeforeRender: false
      });
      this.$refs.game.appendChild(this.pixiApp.view);

      this.pixiApp.renderer.backgroundColor = 0x888888; 
      console.log(this.pixiApp.renderer.plugins.interaction);
      this.pixiApp.renderer.plugins.interaction.autoPreventDefault = false;
      this.pixiApp.renderer.view.style['touch-action'] = 'auto';
      this.pixiLoader = new this.$pixi.loaders.Loader();

      // load assets
      this.pixiLoader.add('wholeBike.jpg');
      this.pixiLoader.add('wheel', 'wheel.png');
      this.pixiLoader.add('frame', 'frame.png');
      this.pixiLoader.add('sky', 'sky@4x.jpg');
      this.pixiLoader.add('mud1', 'mud1.png');
      this.pixiLoader.add('dirtGround', 'dirtGround.png');
      this.pixiLoader.add('ground0', 'ground01.png');
      this.pixiLoader.add('ground1', 'ground02.png');
      this.$nextTick(() => {
        this.pixiLoader.load(this.setup);
        this.pixiLoader.on('progress', (loader) => {
          console.log('loading (' + loader.progress + '%)');
          this.$nuxt.$loading.increase(loader.progress);
        });
        this.$nuxt.$loading.start();
      });
    },
    setup() {
      console.log('images loaded');
      this.$nuxt.$loading.finish();
      const { Sprite, particles: { ParticleContainer }, Container, Graphics, Polygon, extras: { TilingSprite } } = this.$pixi;
      //const TilingSprite = this.$pixi.extras.TilingSprite;
      const app = this.pixiApp;
      const viewWidth = app.renderer.view.width, viewHeight = app.renderer.view.height;
      const resources = this.pixiLoader.resources;
      //this.bike = new Sprite(resources['wholeBike.jpg'].texture);

      // initialise les Sprites necessaires au simulateur
      const sky = new Sprite(resources['sky'].texture);
      sky.position.set(0, 0);
      sky.width = viewWidth;
      sky.height = viewHeight;

      this.frontWheel = new Sprite(resources['wheel'].texture);
      this.frontWheel.anchor.set(0.5, 0.5);
      this.frontWheel.position.set(viewWidth / 2 + 170, viewHeight - 150);

      this.backWheel = new Sprite(resources['wheel'].texture);
      this.backWheel.anchor.set(0.5, 0.5);
      this.backWheel.position.set(viewWidth / 2 - 170, viewHeight - 150);

      this.frame = new Sprite(resources['frame'].texture);
      this.frame.anchor.set(0.5, 0.5);
      this.frame.position.set(viewWidth / 2, viewHeight - 235);

      let points = [279.6, 49.9, 250.5, 68.5, 180, 210.8, 164, 226.8, 135.4, 223.7, 118, 208, 102, 145, 109.9, 109.1, 84.7, 27.6, 50.7, 12.2, 50, 9, 130.1, 8.6, 131.7, 12.6, 111.1, 12.2, 93.7, 26.4, 116, 96, 142.3, 97.3, 267.9, 25.2];
      for(let i = 0, l = points.length; i < l; i+=2) {
        points[i] += viewWidth / 2 - 180;
        points[i+1] += viewHeight - 235 - 113;
      }
      const graphics = new Graphics();
      graphics.beginFill(0xFF3300);
      graphics.drawShape(new Polygon(points));
      this.frameHitArea = new Polygon(points);

      this.groundContainer = new Container();
      this.dirtGroundSprites = [];
      for(let i = 0; i < viewWidth + 64; i+=64) {
        let dirtGround = new Sprite(resources['dirtGround'].texture);
        dirtGround.position.set(i, viewHeight - 64);
        dirtGround.tint= 0x634100;
        this.groundContainer.addChild(dirtGround);
        this.dirtGroundSprites.push(dirtGround);

        let ground = new Sprite(resources['ground' + Math.floor(Math.random() * 2)].texture);
        ground.position.set(i, viewHeight - 64);
        this.groundContainer.addChild(ground);
      }

      this.mudContainer = new ParticleContainer(16000);

      // construit le stage graph
      app.stage.addChild(sky);
      app.stage.addChild(this.frontWheel);
      app.stage.addChild(this.backWheel);
      app.stage.addChild(this.frame);
      app.stage.addChild(this.mudContainer);
      app.stage.addChild(this.groundContainer);
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
      this.entranceTimeline.from(this.frame, 0.3, { y: -150, alpha: 0, ease: Linear.easeNone }, 'frameEntrance');
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
      const viewWidth = app.renderer.view.width, viewHeight = app.renderer.view.height;
      const va = this.speed * 0.002;
      const vx = va * 102;

      // génère de la boue :)
      for(let i = 0; i < this.speed / 10; i++) {
        let mud = new Sprite(resources['mud1'].texture);
        mud.tint = this.mudType.tint;
        mud.airCx = this.mudType.cx;
        mud.anchor.set(0.5, 0.5);
        if(Math.random() > 0.5) {
          mud.cx = viewWidth / 2 - 170;
          mud.cy = viewHeight - 150;
        }
        else {
          mud.cx = viewWidth / 2 + 170;
          mud.cy = viewHeight - 150;
        }
        mud.r = 102 + Math.random() * 2;
        mud.angle = (Math.PI / 2) + (Math.random() * 0.2 - 0.1);
        mud.born = app.ticker.lastTime;
        mud.state = 0;
        this.mudContainer.addChild(mud);
        this.mudCount.onWheels++;
      }

      // on fait bouger la boue
      // console.log(this.mudContainer.children.length);
      this.mudCount.total = this.mudContainer.children.length;
      this.mudContainer.children.forEach(mud => {
        if(app.ticker.lastTime - mud.born > 100000) {
          // console.log('removing mud due to old age');
          this.mudContainer.removeChild(mud);
          switch(mud.state) {
            case 0: this.mudCount.onWheels--; break;
            case 1: this.mudCount.flying--; break;
            case 2: this.mudCount.onBike--; break;
          }
        }
        else if(mud.y > viewHeight + 10) {
          // console.log('removing mud due to out of screen');
          this.mudContainer.removeChild(mud);
          this.mudCount.flying--;
        }
        else {
          switch(mud.state) {
            case 0:
              mud.angle += va;
              mud.position.set(mud.cx + Math.cos(mud.angle) * mud.r, mud.cy + Math.sin(mud.angle) * mud.r);
              if(Math.random() * 200 < mud.r * va * va) {
                mud.state = 1;
                this.mudCount.onWheels--;
                this.mudCount.flying++;

                mud.vx = va * mud.r * -Math.sin(mud.angle) + vx;
                mud.vy = va * mud.r * Math.cos(mud.angle);
              }
              break;
            case 1:
              let ax = mud.vx * mud.vx * mud.airCx;
              mud.vx += mud.vx > 0 ? -ax : ax;
              let ay = mud.vy * mud.vy * mud.airCx;
              mud.vy += mud.vy > 0 ? -ay : ay;
              mud.vy += 0.0981;
              mud.x += mud.vx - vx;
              mud.y += mud.vy;
              if(this.frameHitArea.contains(mud.x, mud.y)) {
                // console.log('mud hit frameHitArea');
                mud.state = 2;
                this.mudCount.flying--;
                this.mudCount.onBike++;
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
      this.groundContainer.children.forEach(s => {
        s.x -= vx;
        if(s.x < -64) {
          s.x += viewWidth + 64;
        }
      });
      //console.log(this.dirtGroundSprites[0].tint);
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

<style>
.game {
  width: 100%;
}
</style>
