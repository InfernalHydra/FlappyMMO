import React, {Component} from 'react';
import Phaser from 'phaser'

export default class Game extends Component
{
  constructor(props)
  {
    super(props);
  }

  createGame(width, height)
  {
    var config = {
      type: Phaser.AUTO,
      width: width,
      height: height,
      scene: {
        preload: this.preload,
        create: this.create,
        update: this.update
      }
    };

    var game = new Phaser.Game(config);
  }
  preload()
  {
    //this.load.image('bird', '../../static/bird.png');
    this.load.setBaseURL('http://labs.phaser.io');

    this.load.image('sky', 'assets/skies/space3.png');
    this.load.image('logo', 'assets/sprites/phaser3-logo.png');
    this.load.image('red', 'assets/particles/red.png');
  }

  componentDidMount()
  {
    this.createGame(this.props.width, this.props.height);
  }
  create()
  {
    //this.add.image(200, 20, 'bird').setOrigin(0, 0)
    this.add.image(400, 300, 'sky');

    var particles = this.add.particles('red');

    var emitter = particles.createEmitter({
        speed: 100,
        scale: { start: 1, end: 0 },
        blendMode: 'ADD'
    });

    var logo = this.physics.add.image(400, 100, 'logo');

    logo.setVelocity(100, 200);
    logo.setBounce(1, 1);
    logo.setCollideWorldBounds(true);

    emitter.startFollow(logo);
  }
  update()
  {

  }
  render()
  {
    return <div id="game"></div>;
  }
}
