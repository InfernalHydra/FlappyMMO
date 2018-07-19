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
        preload: preload,
        create: create,
        update: update
      }
    };

    var game = new Phaser.Game(config);
    var preload = () => {};
    var create = () => {};
    var update = () => {};
  }

  componentDidMount()
  {
    this.createGame(this.props.width, this.props.height);
  }

  render()
  {
    return <div id="game"></div>;
  }
}
