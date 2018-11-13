
import * as PIXI from 'pixi.js';
import TweenMax from "gsap/TweenMax";
import ColorPropsPlugin from 'gsap/ColorPropsPlugin';

export default({ app }, inject) => {
  inject('pixi', PIXI);
};
