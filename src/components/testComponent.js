import React, { Component } from 'react'

import { Breadcrumb, Button, Dropdown, Icon, Input, Layout, Menu, Modal, Row, Col, Spin, Table, Tag, Tree } from 'antd'

const TreeNode = Tree.TreeNode

class TestComponent extends Component {
  constructor(props) {
    super(props)
  }

  state = {
    treeData: [
      {
        title: 'root',
        key: '0',
        children: [
          { title: 'Expand to load', key: '1' },
          { title: 'Expand to load', key: '2' },
          { title: 'Tree Node', key: '3', isLeaf: true }
        ]
      }
    ]
  }

  onLoadData = treeNode =>
    new Promise(resolve => {
      console.dir(treeNode)
      if (treeNode.props.children) {
        treeNode.isLeaf(true)
        resolve()
        return
      }
      setTimeout(() => {
        treeNode.props.dataRef.children = [
          { title: 'Child Node', key: `${treeNode.props.eventKey}-0` },
          { title: 'Child Node', key: `${treeNode.props.eventKey}-1` }
        ]
        this.setState({
          treeData: [...this.state.treeData]
        })
        resolve()
      }, 1000)
    })

  renderTreeNodes = data =>
    data.map(item => {
      if (item.children) {
        return (
          <TreeNode title={item.title} key={item.key} dataRef={item}>
            {this.renderTreeNodes(item.children)}
          </TreeNode>
        )
      }
      return <TreeNode title={item.title} key={item.key} isLeaf={item.isLeaf} dataRef={item} />
    })

  render() {
    return (
      <Tree
        // loadData={this.onLoadData}
        onExpand={(expandedKeys, ext) => {
          const { expanded, node } = ext
          if (expanded) {
            console.dir(node)
            node.props.dataRef.children.push({ title: 'new Node', key: `5` })
            this.setState({
              treeData: [...this.state.treeData]
            })
            console.log(expanded)
          }
        }}
      >
        {this.renderTreeNodes(this.state.treeData)}
      </Tree>
    )
  }
}

export default TestComponent
