import React, {Component} from 'react';
import Phaser from 'phaser';

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
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: {y: 200}
        }
      },
      backgroundColor: '#71c5cf',
    };

    var game = new Phaser.Game(config);
    var player;
  }
  preload()
  {
    this.load.image('bird', '/bird.png');
    this.load.image('pipe', '/pipe.png');
  }

  componentDidMount()
  {
    this.createGame(this.props.width, this.props.height);
  }
  create()
  {
    this.player = this.physics.add.sprite(100, 150, 'bird');
    //this.add.image(100, 150, 'pipe');
  }
  update()
  {
    var spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    if(this.input.keyboard.checkDown(spaceBar, 1000))
    {
      console.log("space bar down");
      this.player.setVelocityY(-160);
    }
  }
  render()
  {
    return <div id="game"></div>;
  }
}
