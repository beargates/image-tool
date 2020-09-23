const { webFrame } = require('electron')

import React, { Component } from 'react'
import { hot } from 'react-hot-loader'

import config from '../config'

import Create from './components/compress'
import TestComponent from './components/testComponent'

webFrame.setZoomFactor(config.hiDPI ? 2 : 1) // 这里设置有效

class App extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return <Create />
    // return <TestComponent />
  }
}

export default hot(module)(App)
