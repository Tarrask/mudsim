<template>
<div>
  <h1>A bike riding in mud simulator</h1>
  <div id="canvas">
  </div>
  <div id="controls">
    <input type="range" min="0" max="50" v-model="speed">
  </div>
</div>
</template>

<style>

#canvas {
  position: absolute;
  width: 960px;
  height: 500px;
  margin: 150px 0;
  top: 0;
  left: 0;
  background: lightgray;
}

circle {
  stroke: #1abc9c;
  stroke-width: 2;
  fill: white;
}
.wheel {
  stroke: black;
  stroke-width: 1;
  fill: dimgray;
}
.sprokes {
  stroke: dimgray;
  stroke-width: 1;
  fill: none;
}
.frame {
  stroke: #000080;
  stroke-width: 1;
}
.decoration {
  font-family: sans-serif;
  font-weight: bold;
  fill: #ffe100;
}
.mud {
  stroke: RGB(112, 69, 41);
  stroke-width: 1;
  fill: rgba(112, 69, 41, 1);
}
</style>

<script>
import * as d3 from 'd3';

export default {
  data() {
    return {
      speed: 1,
      circle_data: [{
        "x": 0,
        "y": 0,
        "r": 10
      }, {
        "x": 200,
        "y": 250,
        "r": 10
      }, {
        "x": 300,
        "y": 180,
        "r": 10
      }]
    };
  },
  mounted() {
    const width = 960,
          height = 500,
          speed = -0.12,
          frontX = -170,
          backX = 170,
          wheelY = 100,
          wheelDef = {teeth: 160, sprokes: 16, r0: 85, r1: 100, r2: 102};
    const svg = d3.select('#canvas')
      .append('svg').attr('width', width).attr('height', height);

    const gradient = svg.append('defs').append('linearGradient')
      .attr('id', 'arcenciel').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%');
    gradient.append('stop').attr('offset', '0%').attr('style', 'stop-color:rgb(128,0,255);stop-opacity:1');
    gradient.append('stop').attr('offset', '100%').attr('style', 'stop-color:rgb(255,128,128);stop-opacity:1');

    const svgFrame = svg.append('g').attr('transform', `translate(${width/2}, ${height/2})`)
      .append('g').append('g').datum({ radius: Infinity });

    //svgFrame.append('image').attr('xlink:href', '8806.jpg').attr('height', '400').attr('y', '-160').attr('width', '610').attr('x', '-303');

    const frontWheel = svgFrame.append('g').attr('transform', `translate(${frontX}, ${wheelY})`)
      .append('g').attr('class', 'wheel').datum(wheelDef);
    frontWheel.append('path').attr('d', wheel);
    frontWheel.append('path').attr('d', sprokes).attr('class', 'sprokes');

    const backWheel = svgFrame.append('g').attr('transform', `translate(${backX}, ${wheelY})`)
      .append('g').attr('class', 'wheel').datum(wheelDef);
    backWheel.append('path').attr('d', wheel);
    backWheel.append('path').attr('d', sprokes).attr('class', 'sprokes');

    const framePath = svgFrame.append('g').attr('class', 'frame').attr('fill', 'url(#arcenciel)')
      .append('path').attr('class', 'framePath').attr('d', frame);


    svgFrame.append('rect').attr('x', -width/2).attr('y', 200).attr('width', width).attr('height', 50);

    let x = -64, y = -20;
    svgFrame.append('text').attr('x', x).attr('y', y).attr('class', 'decoration').html('THEOS').attr('transform', `rotate(63.5, ${x}, ${y})`);

    let lastTime = 0;
    let wheelAngle = 0;
    let lastMudTime = -100000;

    d3.timer(t => {
      const va = (this.speed * -0.01);
      const dt = t - lastTime;
      const da = dt * va;

      // rotate wheels
      wheelAngle += da;
      svgFrame.selectAll('.wheel').attr('transform', `rotate(${wheelAngle})`);

      // spawn mud
      if(t - lastMudTime > 10) {
        svgFrame.append('circle').attr('r', 2).attr('class', 'mud').datum({cx: frontX, cy: wheelY, r: wheelDef.r2, angle: 90, state: 0, bornTime: t});

        lastMudTime = t;
      }

      // animate mud
      svgFrame.selectAll('.mud').each(function(d, i) {
        d.angle += da;
        if(t - d.bornTime > 500000) {
          d3.select(this).remove();
        }
        else if(d.state === 0){ // sticking
          d3.select(this).attr('cx', d.cx + Math.cos(d.angle * Math.PI / 180) * d.r).attr('cy', d.cy + Math.sin(d.angle * Math.PI / 180) * d.r);
          if(Math.random() * 500 < d.r * va * va) {
            d.state = 1;
            d.x = d.cx + Math.cos(d.angle * Math.PI / 180) * d.r;
            d.y = d.cy + Math.sin(d.angle * Math.PI / 180) * d.r;
            d.vx = va * Math.PI / 180 * d.r * -Math.sin(d.angle * Math.PI / 180);
            d.vy = va * Math.PI / 180 * d.r * Math.cos(d.angle * Math.PI / 180);
          }
        }
        if(d.state === 1) {
          d.vy += 0.0001 * dt;
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          d3.select(this).attr('cx', d.x).attr('cy', d.y);
          let colliding = document.elementsFromPoint(d.x + width / 2, d.y + height / 2 + 150);
          if(colliding.length > 1 && colliding[1].className.baseVal === 'framePath') {
            d.state = 2;
          }
        }
      });

      lastTime = t;
    });

    function frame(d) {
      let path = ['M-155,106'];
      path.push('L-100,-25L-85,-40L-70,-30L-0,110L15,125L42,122L55,110L173,105L176,100L176,96L173,91L70,17L67,12L92,-70L126,-85L126,-88L115,-89L100,-88L90,-88L70,-90L55,-90L47,-88L47,-85L67,-85L85,-72L62,-03L35,-01L-35,-46L-75,-65L-74,-69L-76,-70L-70,-85L-95,-98L-100,-88L-82,-78L-84,-73L-87,-74L-97,-54L-102,-40L-107,-40L-162,93L-172,93L-178,102L-172,110Z');
      path.push('M-60,-45L-52,-42L-40,-38L30,10L55,13L56,16L45,52L32,72L32,82L25,87L15,84L5,85L2,85L-58,-35L-64,-43Z');
      path.push('M62,28L65,40L65,55L56,85L54,85L50,72L54,62L56,42Z');
      path.push('M73,28L155,88L155,95L62,95L75,45');
      path.push('Z');

      return path.join('');
    }

    function wheel(d) {
      const n = d.teeth;
      const da = 2 * Math.PI / n;
      const p = 1.6 / n;

      let path = [`M${d.r1 * Math.cos(2 * p)},${d.r1 * Math.sin(2 * p)}`];
      for(let i = 1; i < n; i=i+2) {
        path.push(`L${d.r1 * Math.cos(da * i)},${d.r1 * Math.sin(da * i)}`);
        path.push(`L${d.r2 * Math.cos(da * i + p)},${d.r2 * Math.sin(da * i + p)}`);
        path.push(`L${d.r2 * Math.cos(da * (i + 1))},${d.r2 * Math.sin(da * (i + 1))}`);
        path.push(`L${d.r1 * Math.cos(da * (i + 1) + 2 * p)},${d.r1 * Math.sin(da * (i + 1) + 2 * p)}`);
      }
      path.push(`M0,${-d.r0}A${d.r0},${d.r0} 0 0,0 0,${d.r0}A${d.r0},${d.r0} 0 0,0 0,${-d.r0}Z`);

      return path.join('');
    }

    function sprokes(d) {
      const n = d.sprokes,
            da = Math.PI / n;

      let path = [];
      for(let i = 0; i < 2*n; i=i+2) {
        path.push(`M${d.r0 * Math.cos(da * i)},${d.r0 * Math.sin(da * i)}`);
        path.push(`L${d.r0 * -Math.cos(da * (i-1))},${d.r0 * -Math.sin(da * (i-1))}`);
      }

      return path.join('');
    }
  }
};
</script>