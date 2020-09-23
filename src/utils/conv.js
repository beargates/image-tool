const fs = require('fs')
const path = require('path')

import { toPromise, toPromiseOne } from './help'
const { app } = require('electron').remote

export default class Conv {
  constructor() {
    this.ffmpeg = require('fluent-ffmpeg')

    // let audio_codec = 'libfdk_aac';
    this.audio_codec = 'aac'

    let platform = require('os').platform()

    this.dev_null = '/dev/null'

    // console.dir(`app.getAppPath():${app.getAppPath()}`)

    if (platform === 'win32') {
      this.dev_null = 'NUL'
    }

    const ffmpegPath = path.resolve(app.getAppPath().replace('app.asar', 'app.asar.unpacked'), require('ffmpeg-static').path)
    // const ffprobePath = path.resolve(app.getAppPath().replace('app.asar', 'app.asar.unpacked'), require('ffprobe-static').path)

    this.ffmpeg.setFfmpegPath(ffmpegPath)
    // this.ffmpeg.setFfprobePath(ffprobePath)

    this.command = null
  }

  convMP4Pass1() {
    return new Promise((resolve, reject) => {
      const { src, videoRate, extParmList, logDir } = this.config
      let oldPercent = 0
      this.command = this.ffmpeg({ logger: 'debug' })
        .input(src) // path.normalize规避wndows和linux路径的差异
        .videoCodec('libx264')
        .addOptions([
          '-pass 1',
          `-passlogfile ${path.resolve(logDir, 'conv_mp4.log')}`,
          '-bf 4',
          '-subq 1',
          `-b:v ${videoRate}`,
          '-direct-pred auto',
          '-pix_fmt yuv420p',
          ...extParmList, // 可以处理空数组
          '-v info', // info 状态下才有进度
          // '-v warning',
          '-f mp4'
        ])
        .output(this.dev_null)
        .on('start', commandLine => {
          if (this.config.debug) console.log(`convMP4Pass1 commandLine: ${commandLine}`)
          const msg = `文件 ${src} 转码开始`
          if (this.config.debug) console.log(msg)
        })
        .on('stderr', function() {})
        .on('error', err => {
          console.dir(err)
          reject(err)
        })
        .on('end', () => {
          const msg = 'getPass1Promise conv end'
          //   console.log(msg)
          resolve()
        })

      this.command.run()
    })
  }

  convMP4Pass2() {
    return new Promise((resolve, reject) => {
      const { src, audioRate, videoRate, duration, extParmList, dstMP4, logDir } = this.config
      this.command = this.ffmpeg({ logger: 'debug' })
        .input(src)
        .audioCodec(this.audio_codec)
        .videoCodec('libx264')
        .addOptions([
          '-pass 2',
          '-passlogfile ' + path.resolve(logDir, 'conv_mp4.log'),
          '-ab ' + audioRate,
          '-ar 22050',
          '-ac 2',
          '-codec:a:0 copy',
          '-direct-pred auto',
          '-map_metadata -1',
          '-map_chapters -1',
          '-aq-mode 1',
          '-bf 4',
          '-subq 4',
          '-refs 4',
          '-me_method umh',
          '-b:v ' + videoRate,
          '-movflags faststart',
          '-pix_fmt yuv420p',
          ...extParmList, //可以处理空数组
          '-v info', // info 状态下才有进度
          // '-v warning',
          '-f mp4'
        ])
        .output(dstMP4 + '.tmp')
        .on('start', commandLine => {
          if (this.config.debug) console.log(`convMP4Pass2 commandLine: ${commandLine}`)
        })
        .on('end', () => {
          const msg = `文件 ${src} 转码完成`
          if (this.config.debug) console.log(msg)
          resolve()
        })
        .on('stderr', function() {})
        .on('error', err => {
          console.dir(err)
          reject(err)
        })

      this.command.run()
    })
  }

  convMP4Huohua() {
    return new Promise((resolve, reject) => {
      const { src, audioRate, videoRate, duration, extParmList, dstMP4, logDir } = this.config
      this.command = this.ffmpeg({ logger: 'debug' })
        .input(src)
        .videoCodec('libx264')
        .addOptions([
          '-crf ' + videoRate,
          '-preset slower',
          '-refs 6',
          '-bf 6',
          '-deblock 1:1',
          '-qcomp 0.5',
          '-psy-rd 0.3:0',
          '-aq-mode 2',
          '-aq-strength 0.8',
          '-passlogfile ' + path.resolve(logDir, 'conv_mp4.log'),
          '-c:a aac',
          '-profile:a aac_low',
          '-ab ' + audioRate,
          '-ar 48000',
          '-ac 2',
          '-direct-pred auto',
          '-map_metadata -1',
          '-map_chapters -1',
          '-movflags faststart',
          '-pix_fmt yuv420p',
          ...extParmList, //可以处理空数组
          //   '-v info', // info 状态下才有进度
          '-v warning',
          '-f mp4'
        ])
        .output(dstMP4)
        .on('start', commandLine => {
          if (this.config.debug) console.log(`convMP4Huohua commandLine: ${commandLine}`)
        })
        .on('end', () => {
          const msg = `文件 ${src} 转码完成`
          if (this.config.debug) console.log(msg)
          resolve()
        })
        .on('stderr', function() {})
        .on('error', err => {
          //   console.dir(err)
          reject(err)
        })

      this.command.run()
    })
  }

  async convMP4() {
    try {
      const { dstMP4 } = this.config

      await this.convMP4Huohua()
    } catch (err) {
      console.dir(err)
      return Promise.reject(err)
    }
  }

  async start(src, config) {
    try {
      //   读取配置文件
      //   const data = await toPromise(fs.readFile)(path.resolve(__dirname, '..', 'config.json'))
      //   const config = JSON.parse(data.toString())

      const logDir = path.resolve(app.getAppPath(), '..', 'logs')
      if (await toPromiseOne(fs.access)(logDir, fs.constants.F_OK)) {
        await toPromiseOne(fs.mkdir)(logDir)
      }

      this.config = { src, logDir, ...config }
      this.config.dstMP4 = this.config.src.replace(/(.+)\.[^.]+$/, '$1') + '.tmp'

      await this.convMP4()
      await toPromiseOne(fs.rename)(this.config.src, this.config.src + '.old')
      await toPromiseOne(fs.rename)(this.config.dstMP4, this.config.dstMP4.replace('.tmp', '.mp4'))
    } catch (err) {
      console.dir(err)
      return Promise.reject(err)
    }
  }

  stop() {
    try {
      console.log('stop convert')
      if (this.command) {
        this.command.kill()
        this.command = null
      }
    } catch (err) {
      return Promise.reject(err)
    }
  }
}
