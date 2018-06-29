<template>
<div class="mudsim">
  <div class="title form-inline">
    <h1>{{ $t('title') }}</h1>
    <select @change="switchLocale" class="form-control">
      <option v-for="locale in $i18n.locales" :value="locale.code" :selected="locale.code === 
$i18n.locale">{{ locale.name }}</option>
    </select>
  </div> 
  <div class="controls-container">
    <div class="controls">
      <div class="col form-group">
        <button class="btn btn-primary btn-block" @click="restart">{{ $t('restart') }}</button>
      </div>
      <div class="col form-group">
        <label for="speedControl">{{ $t('speed') }} ({{ (speed/2).toFixed(0) }} {{ $t('speedUnit') }})</label>
        <input class="form-control-range" id="speedControl" type="range" min="0" max="100" v-model="speed">
      </div>
      <div class="col form-group">
        <label for="mudTypeSelect">{{ $t('mudType') }}</label>
        <select class="form-control" id="mudTypeSelect" v-model.number="mudType">
          <option v-for="type in mudTypes" :value="type">{{ $t(`mudTypes.${type.name}`) }}</option>
        </select>
      </div>
      <div class="col form-group">
        <label for="guardTypeSelect">{{ $t('mudguard') }}</label>
        <select class="form-control" id="guardTypeSelect" v-model="guardType">
          <option v-for="type in guardTypes" :value="type">{{ type.name }}</option>
        </select>
      </div>
    </div>
    <!-- {{ mudCount }} -->
  </div>

  <div class="game" ref="game"></div>
  <!-- <div class="xl">xl</div>
  <div class="lg">lg</div>
  <div class="md">md</div>
  <div class="sm">sm</div>
  <div class="xs">xs</div> -->
</div>
</template>

<script>
import debounce from 'debounce';

const MUD_ON_WHEEL = 0;
const MUD_FLYING = 1;
const MUD_ON_FRAME = 2;
const MUD_ON_GUARD = 3;

export default {
  head() {
    return {
      title: 'Mudsim - ' + this.$t('title')
    };
  },
  data() {
    const mudTypes = [
      { name: 'brown', tint: 0x634100, cx: 0.001 },
      { name: 'ocre', tint: 0xB88A00, cx: 0.002 }, 
      { name: 'snow', tint: 0xffffff, cx: 0.004 }
    ];
    const guardTypes = [
      { name: 'No mud guard', prefix: 'noguard' },
      { name: 'Plastic fork guard', prefix: 'fork' },
      //{ name: 'Neopren fork guard', prefix: 'neopren' },
      //{ name: 'Big mud guard', prefix: 'big' }
    ];
    return {
      speed: 10,
      mudTypes,
      mudType: mudTypes[0],
      guardTypes,
      guardType: guardTypes[0],
      screenWidth: 0,
      screenHeight: 0,
      mudCount: {
        onWheels: 0,
        flying: 0,
        onBike: 0,
        onMudGard: 0
      },
      frameWidth: 0,
      frameHeight: 0,
      frameHeightOffset: 235
    };
  },
  mounted() {
    this.recalculateViewport();
    this.init();

    window.addEventListener('resize', this.recalculateViewport);
    window.addEventListener('orientationchange', this.recalculateViewport);
    // window.addEventListener('click', () => { console.log('click'); });
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
    },
    guardType(newVal) {
      TweenMax.to(this.mudguard, 0.2, { alpha: 0, onComplete() {
        this.mudguard.texture = this.pixiLoader.resources[newVal.prefix].texture;
        TweenMax.to(this.mudguard, 0.2, { alpha: 1 });
      }, onCompleteScope: this });

      let muds = this.mudContainer.children.filter(c => c.state === MUD_ON_GUARD);
      TweenMax.to(muds, 0.2, { alpha: 0, onComplete() {
        muds.forEach(mud => this.mudContainer.removeChild(mud));
      }, onCompleteScope: this });
    }
  },
  methods: {
    switchLocale(e) {
        this.$i18n.locale = e.target.value;
//        this.$router.replace(this.switchLocalePath(e.target.value));
        history.replaceState({}, e.target.value,
this.$router.options.base + this.switchLocalePath(e.target.value).substring(1));
    },
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
      this.pixiLoader.add('wheel', 'wheel.png');
      this.pixiLoader.add('frame', 'frame.png');
      this.guardTypes.forEach(type => {
        this.pixiLoader.add(type.prefix, `${type.prefix}.png`);
      });
      this.pixiLoader.add('sky', 'sky@4x.jpg');
      this.pixiLoader.add('mud1', 'mud1.png');
      this.pixiLoader.add('dirtGround', 'dirtGround.png');
      this.pixiLoader.add('ground0', 'ground01.png');
      this.pixiLoader.add('ground1', 'ground02.png');
      this.$nextTick(() => {
        this.pixiLoader.load(this.setup);
        this.pixiLoader.on('progress', (loader) => {
          this.$nuxt.$loading.increase(loader.progress);
        });
        this.$nuxt.$loading.start();
      });
    },
    setup() {
      console.log('images loaded');
      this.$nuxt.$loading.finish();
      const { Sprite, particles: { ParticleContainer }, Container, Graphics, Polygon, extras: { TilingSprite } } = this.$pixi;
      const app = this.pixiApp;
      const viewWidth = app.renderer.view.width, viewHeight = app.renderer.view.height;
      const resources = this.pixiLoader.resources;
      this.frameWidth = resources['frame'].texture.width;
      this.frameHeight = resources['frame'].texture.height;

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
      this.frame.position.set(viewWidth / 2, viewHeight - this.frameHeightOffset);

      this.mudguard = new Sprite(resources['noguard'].texture);
      this.mudguard.anchor.set(0.5, 0.5);
      this.mudguard.position.set(viewWidth / 2, viewHeight - this.frameHeightOffset);

      // les shapes de collisions
      let collisionSvg = require('!svg-inline-loader!~/static/collisions.svg');
      this.frameHitArea = this.svgPathToPolygon(collisionSvg, 'frame');
      this.guardTypes.forEach(type => {
        type.hitArea = this.svgPathToPolygon(collisionSvg, `${type.prefix}-shape`);
        type.hitLine = this.svgPathToLine(collisionSvg, `${type.prefix}-line`);
      });
      // >>>>>>>> TEMP 
      const graphics = new Graphics();
      graphics.beginFill(0x00FF00);
      graphics.drawShape(this.frameHitArea);
      graphics.alpha = 0.5;
      // <<<<<<<< TEMP

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
      app.stage.addChild(this.mudguard);
      app.stage.addChild(this.frame);
      app.stage.addChild(this.mudContainer);
      app.stage.addChild(this.groundContainer);
      //app.stage.addChild(graphics);

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
        mud.state = MUD_ON_WHEEL;
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
            case MUD_ON_WHEEL:
              mud.angle += va;
              mud.position.set(mud.cx + Math.cos(mud.angle) * mud.r, mud.cy + Math.sin(mud.angle) * mud.r);
              if(Math.random() * 200 < mud.r * va * va) {
                mud.state = MUD_FLYING;
                this.mudCount.onWheels--;
                this.mudCount.flying++;

                mud.vx = va * mud.r * -Math.sin(mud.angle) + vx;
                mud.vy = va * mud.r * Math.cos(mud.angle);
              }
              break;
            case MUD_FLYING:
              let ax = mud.vx * mud.vx * mud.airCx;
              mud.vx += mud.vx > 0 ? -ax : ax;
              let ay = mud.vy * mud.vy * mud.airCx;
              mud.vy += mud.vy > 0 ? -ay : ay;
              mud.vy += 0.0981;
              mud.x += mud.vx - vx;
              mud.y += mud.vy;
              // collision avec le pare-boue
              
              // collision avec le cadre
              if(this.frameHitArea.contains(mud.x, mud.y)) {
                // console.log('mud hit frameHitArea');
                mud.state = MUD_ON_FRAME;
                this.mudCount.flying--;
                this.mudCount.onBike++;
              }
              else if(this.guardType.hitArea.contains(mud.x, mud.y)) {
                mud.state = MUD_ON_GUARD;
                this.mudCount.flying--;
                this.mudCount.onMudGard++;
              }
              else {
                let colPoint = this.segmentIntersection(mud.x, mud.y, mud.x - (mud.vx - vx), mud.y - mud.vy,
                ...this.guardType.hitLine);
                // 252.266 + viewWidth / 2 - 180, 120.402 + viewHeight - 235 - 113, 335.96 + viewWidth / 2 - 180, 85.826 + viewHeight - 235 - 113);
                if(colPoint) {
                  mud.x = colPoint.x;
                  mud.y = colPoint.y;
                  mud.state = MUD_ON_GUARD;
                  this.mudCount.flying--;
                  this.mudCount.onMudGard++;
                }
              }
              break;
            case MUD_ON_FRAME:
            case MUD_ON_GUARD:
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
    },
    svgPathToLine(svg, pathId) {
      let el = document.createElement('div');
      el.innerHTML = svg;
      let lineString = el.querySelector('#' + pathId).getAttribute('d');
      let points = lineString.substring(1).split(/[L,]/).map(v => parseFloat(v));
      for(let i = 0, l = points.length; i < l; i+=2) {
        points[i] += this.pixiApp.renderer.view.width / 2 - 180;
        points[i+1] += this.pixiApp.renderer.view.height - 235 - 113;
      }
      return points;
    },
    svgPathToPolygon(svg, pathId) {
      let points = this.svgPathToLine(svg, pathId);
      return new this.$pixi.Polygon(points);
    },
    segmentIntersection(ax, ay, bx, by, cx, cy, dx, dy) {
      let t = 1 / ((bx - ax) * (dy - cy) - (by - ay) * (dx-cx));
      let r = ((ay - cy) * (dx - cx) - (ax - cx) * (dy - cy)) * t;
      let s = ((ay - cy) * (bx - ax) - (ax - cx) * (by - ay)) * t;

      if(0 <= r && r <= 1 && 0 <= s && s <= 1) {
        return {
          x: ax + r * (bx - ax),
          y: ay + r * (by - ay)
        }
      }
      else {
        return null;
      }
    }
  }
};
</script>

<style lang="scss">
@import "assets/styles/variables";
@import "node_modules/bootstrap/scss/forms";

.title {
  display: flex;
  justify-content: space-between;
  background-color: lighten($primary, 00%);
  color: $white;
  padding: $navbar-padding-y $navbar-padding-x;
  h1 {
    margin: 0;
  }
  select, select:focus {
    color: $white;
    background: transparent;
  }
}


.controls-container {
  border-left: $border-width solid $primary;
  border-right: $border-width solid $primary;
  padding-left: $grid-gutter-width / 2;
  padding-right: $grid-gutter-width / 2;

  .controls {
    @include make-row();
    align-items: center;
    padding-top: $form-group-margin-bottom;

    .col {
      @include make-col-ready();
      @include make-col(12);
      @include media-breakpoint-up(sm) {
        flex: 0 0 auto;
        width: auto;
        max-width: none;
      }
    }
  }
}



.form-control-range {
  height: $input-height;
}
.game {
  width: 100%;
  border: 1px solid $primary;

  canvas {
    display: block;
    width: 100%;
  }
}

@each $breakpoint in map-keys($grid-breakpoints) {
  .#{$breakpoint} {
    display: none;
    @include media-breakpoint-only($breakpoint, $grid-breakpoints) { display: block; }
  }
}
</style>
