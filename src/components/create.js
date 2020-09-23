const path = require('path')

import React, { Component } from 'react'

import { Form, Upload, Icon, Button, Layout, List, Select, Spin, Switch } from 'antd'
const { Content, Footer } = Layout
const FormItem = Form.Item
const { Dragger } = Upload
const Option = Select.Option

import { fmtDate } from '../utils/help'
import Conv from '../utils/conv'

import config from '../../config'

const VideoRateList = ['22', '23', '24', '25', '26']
const VideoAspectRatio = ['16:9', '4:3']
const VideoSize = {
  '16:9': ['1920x1080', '1280x720', '1024x576', '640x360'],
  '4:3': ['1440x1080', '1280x960', '1024x768', '640x480']
}

class Create extends Component {
  constructor(props) {
    super(props)

    this.config = config

    this.conv = new Conv()

    this.state = {
      changeVideoSize: true,
      currRate: VideoAspectRatio[1],
      currSize: VideoSize[VideoAspectRatio[1]][2],
      localFileList: new Set(),
      logs: [],
      ready: true,
      videoRate: VideoRateList[1],
      sizeList: VideoSize[VideoAspectRatio[0]],
      spinning: false,
      videoConv: true
    }

    this.draggerProps = {
      name: 'file',
      accept: 'video/*',
      action: '/',
      multiple: true,
      showUploadList: false,
      beforeUpload: file => {
        // CR1811936601.mp4
        // if (file.path.match(/CR\d{10}\.mp4$/)) {
        //   this.state.localFileList.add(file.path)
        // } else {
        //   this.state.logs.push(`${file.path} 文件名无效`)
        // }

        this.state.localFileList.add(file.path)
        this.setState({ localFileList: new Set([...this.state.localFileList]), logs: [...this.state.logs] })
        return false
      }
    }
  }

  async proc() {
    try {
      this.setState({ spinning: true })

      const extParmList = []
      if (this.state.changeVideoSize) {
        extParmList.push(`-s ${this.state.currSize}`)
      }

      this.config = { ...this.config, extParmList, videoRate: this.state.videoRate }

      for (const file of this.state.localFileList) {
        await this.conv.start(file, this.config)
        this.state.logs.push(`${fmtDate('yyyy-MM-dd', Date.now())} ${file} 转码完成`)
      }
      this.setState({ localFileList: new Set([]) })
    } catch (err) {
      //   console.dir(err)
      return Promise.reject(err)
    } finally {
      this.setState({ spinning: false })
    }
  }

  render() {
    const formItemLayout = {
      labelCol: {
        // xs: { span: 16 }
        sm: { span: 4 }
      },
      wrapperCol: {
        // xs: { span: 32 }
        sm: { span: 20 }
      }
    }
    const tailFormItemLayout = {
      wrapperCol: {
        // xs: {
        //   span: 8,
        //   offset: 40
        // }
        sm: {
          span: 2,
          offset: 22
        }
      }
    }

    if (this.state.ready) {
      return (
        <Layout>
          <Spin spinning={this.state.spinning}>
            <Content>
              <Form onSubmit={this.handleSubmit} style={{ background: '#fff', padding: 5, margin: 5 }}>
                {/* <FormItem {...formItemLayout} label="本地转码">
                  <Switch checked={this.state.videoConv} onChange={e => this.setState({ videoConv: !this.state.videoConv })} />
                </FormItem> */}

                {this.state.videoConv && (
                  <FormItem {...formItemLayout} label="视频质量 数字大=码率低">
                    <select value={this.state.videoRate} onChange={e => this.setState({ videoRate: e.target.value })}>
                      {VideoRateList.map((item, index) => (
                        <option key={index} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </FormItem>
                )}

                {this.state.videoConv && (
                  <FormItem {...formItemLayout} label="改变视频分辨率">
                    <Switch
                      checked={this.state.changeVideoSize}
                      onChange={e => this.setState({ changeVideoSize: !this.state.changeVideoSize })}
                    />
                  </FormItem>
                )}

                {this.state.videoConv && this.state.changeVideoSize && (
                  <FormItem {...formItemLayout} label="目标视频分辨率">
                    <Select
                      //   defaultValue={this.state.currRate}
                      style={{ width: 80 }}
                      value={this.state.currRate}
                      onChange={value =>
                        this.setState({
                          currRate: value,
                          currSize: VideoSize[value][0],
                          sizeList: VideoSize[value]
                        })
                      }
                    >
                      {VideoAspectRatio.map(rate => (
                        <Option key={rate}>{rate}</Option>
                      ))}
                    </Select>
                    <Select
                      style={{ width: 120 }}
                      value={this.state.currSize}
                      onChange={value => this.setState({ currSize: value })}
                    >
                      {this.state.sizeList.map(size => (
                        <Option key={size}>{size}</Option>
                      ))}
                    </Select>
                  </FormItem>
                )}

                <FormItem {...formItemLayout} label="视频文件">
                  <Dragger {...this.draggerProps}>
                    <p className="ant-upload-drag-icon">
                      <Icon type="inbox" />
                    </p>
                    <p className="ant-upload-text">点击或者拖拽素材文件到这个区域</p>
                  </Dragger>
                  {this.state.localFileList.size !== 0 && (
                    <List
                      bordered
                      locale={{ emptyText: '' }}
                      dataSource={this.state.localFileList.values()}
                      renderItem={item => (
                        <List.Item
                          actions={[
                            <Button
                              key="0"
                              onClick={e => {
                                this.state.localFileList.delete(item)
                                this.setState({ localFileList: new Set([...this.state.localFileList]) })
                              }}
                            >
                              移除文件
                            </Button>
                          ]}
                        >
                          <List.Item.Meta title={item} />
                        </List.Item>
                      )}
                    />
                  )}
                </FormItem>
                <FormItem {...tailFormItemLayout}>
                  <Button type="primary" onClick={e => this.proc()} disabled={!this.state.localFileList.size}>
                    处理
                  </Button>
                </FormItem>
              </Form>
            </Content>
            <Footer style={{ background: '#fff', padding: 5, margin: 5 }}>
              <List
                header={<p>日志</p>}
                bordered
                locale={{ emptyText: '' }}
                dataSource={this.state.logs}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta title={item} />
                  </List.Item>
                )}
              />
            </Footer>
          </Spin>
        </Layout>
      )
    } else {
      return <Spin />
    }
  }
}

export default Create
