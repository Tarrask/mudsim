
import * as PIXI from 'pixi.js';
import TweenMax from "gsap/TweenMax";

export default({ app }, inject) => {
  inject('pixi', PIXI);
};
