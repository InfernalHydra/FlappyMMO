import React, {Component} from 'react';
import {isMobile} from 'react-device-detect';
import PhaserGame from "../components/PhaserGame.jsx";

export default class App extends Component
{
  render()
  {
    var width = 400, height = 490;
    if(isMobile)
    {
      width = window.innerWidth;
      height = window.innerHeight;
    }
    else
    {
      width = window.innerWidth / 3;
      height = window.innerHeight * (7/8);
    }
    return <PhaserGame width={width} height={height}/>;
  }
}
