function pad(n, width, z = '0') {
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
}

export const getType = arg =>
  Object.prototype.toString
    .call(arg)
    .split(' ')[1]
    .slice(0, -1)

export function arrayBuffer2hex(buf) {
  const view = new Uint8Array(buf)
  const hex = Array.from(view).map(v => pad(v.toString(16), 2))
  return hex.join(' ')
}

export function uint8Array2hex(u8Array) {
  const hex = Array.from(u8Array).map(v => pad(v.toString(16), 2))
  return hex.join(' ')
}

export function dataView2hex(view) {
  return arrayBuffer2hex(view.buffer)
}

export function str2ArrayBuffer(str) {
  const len = str.length
  const buffer = new ArrayBuffer(len)
  const dataView = new DataView(buffer)
  const textEncoder = new TextEncoder()
  for (let i = 0; i < len; i++) {
    dataView.setUint8(i, textEncoder.encode(str[i]))
  }

  return buffer
}

export function hex2ArrayBuffer(str) {
  if (str) {
    const hexList = str.split(' ')
    const view = new Uint8Array(hexList.length)

    for (let i = 0; i < hexList.length; i++) {
      view[i] = parseInt(hexList[i], 16)
    }

    return view.buffer
  } else {
    return new ArrayBuffer(0)
  }
}

export function hex2Uint8Array(str) {
  const hexList = str.split(' ')
  const view = new Uint8Array(hexList.length)

  for (let i = 0; i < hexList.length; i++) {
    view[i] = parseInt(hexList[i], 16)
  }
  return view
}
