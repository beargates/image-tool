import {
  applySnapshot,
  cast,
  castToReferenceSnapshot,
  castToSnapshot,
  detach,
  getSnapshot,
  onPatch,
  onSnapshot,
  unprotect,
  types
} from 'mobx-state-tree'

import { uuid } from './utils/help'
import { logModel } from './utils/storeHelp'

import { Group, GroupList } from './stores/GroupStore'
import { AssetModel } from './stores/AssetStore'
import { FolderModel, getGroupFromDB, ItemModel, TreeModel, TreeNodeModel } from './stores/FolderStore'

const asset = AssetModel.create({
  id: uuid(),
  author: 'test'
})

logModel('asset', asset)
