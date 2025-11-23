export function exportCanvasAsPNG(canvas, filename='export.png'){
  const ratio = window.devicePixelRatio || 1
  const w = canvas.width, h = canvas.height
  const tmp = document.createElement('canvas')
  tmp.width = Math.round(w * ratio)
  tmp.height = Math.round(h * ratio)
  const tctx = tmp.getContext('2d')
  tctx.setTransform(ratio,0,0,ratio,0,0)
  tctx.drawImage(canvas, 0, 0)
  tmp.toBlob(blob => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
  }, 'image/png')
}
