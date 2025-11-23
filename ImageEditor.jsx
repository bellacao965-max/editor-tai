import React, { useRef, useState, useEffect } from 'react'
import StickersPanel from './StickersPanel'
import StickerItem from './StickerItem'
import { exportCanvasAsPNG } from '../utils/canvasUtils'

let bodyPixModel = null
let faceModel = null

export default function ImageEditor(){
  const canvasRef = useRef()
  const [imgSrc, setImgSrc] = useState(null)
  const [stickers, setStickers] = useState([])
  const [packs] = useState(['/stickers/emoji/sample.png'])
  const [loadingModel, setLoadingModel] = useState(false)
  const [status, setStatus] = useState('idle')

  useEffect(()=>{
    // initial blank canvas
    const c = canvasRef.current
    c.width = 800; c.height = 500
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#ddd'
    ctx.fillRect(0,0,c.width,c.height)
  },[])

  function handleFile(e){
    const f = e.target.files?.[0]; if(!f) return
    const url = URL.createObjectURL(f); setImgSrc(url)
    const img = new Image(); img.src = url
    img.onload = ()=>{
      const c = canvasRef.current; c.width = img.width; c.height = img.height
      const ctx = c.getContext('2d'); ctx.drawImage(img,0,0)
    }
  }

  function addSticker(src){
    setStickers(s=>[...s, {src, x:20, y:20, w:100, h:100, rot:0}])
  }

  function updateSticker(i, updated){
    setStickers(s=> s.map((st,idx)=> idx===i? updated: st))
  }
  function removeSticker(i){
    setStickers(s=> s.filter((_,idx)=> idx!==i))
  }

  useEffect(()=>{
    // redraw canvas with stickers overlay if base image present
    const c = canvasRef.current; if(!c) return
    const ctx = c.getContext('2d')
    if(!imgSrc) return
    const img = new Image(); img.src = imgSrc
    img.onload = ()=>{
      ctx.clearRect(0,0,c.width,c.height)
      ctx.drawImage(img,0,0)
      stickers.forEach(s=>{
        const st = new Image(); st.src = s.src
        st.onload = ()=> ctx.drawImage(st, s.x, s.y, s.w, s.h)
      })
    }
  },[stickers, imgSrc])

  async function ensureBodyPix(){
    if(bodyPixModel) return bodyPixModel
    setLoadingModel(true); setStatus('loading-bodypix')
    const bp = await import('@tensorflow-models/body-pix')
    await import('@tensorflow/tfjs')
    bodyPixModel = await bp.load()
    setLoadingModel(false); setStatus('ready')
    return bodyPixModel
  }

  async function applyChromaKey(hex='#00ff00', threshold=70){
    const c = canvasRef.current; const ctx = c.getContext('2d')
    const imgData = ctx.getImageData(0,0,c.width,c.height); const d = imgData.data
    const rG = parseInt(hex.slice(1,3),16), gG = parseInt(hex.slice(3,5),16), bG = parseInt(hex.slice(5,7),16)
    for(let i=0;i<d.length;i+=4){
      const dr = d[i]-rG, dg = d[i+1]-gG, db = d[i+2]-bG
      const dist = Math.sqrt(dr*dr+dg*dg+db*db)
      if(dist < threshold) d[i+3] = 0
    }
    ctx.putImageData(imgData,0,0); setStatus('chroma-applied')
  }

  async function bodySlim(){
    const model = await ensureBodyPix()
    const c = canvasRef.current; const ctx = c.getContext('2d')
    const seg = await model.segmentPerson(c, {internalResolution:'low'})
    const mask = bodyPix.toMask(seg)
    // simple slice-based horizontal warp
    const slices = 20
    const w = c.width, h = c.height
    const off = document.createElement('canvas'); off.width=w; off.height=h
    const offCtx = off.getContext('2d'); offCtx.drawImage(c,0,0)
    ctx.clearRect(0,0,w,h)
    for(let i=0;i<slices;i++){
      const sx = Math.floor(i * w / slices)
      const sw = Math.ceil(w / slices)
      const dx = Math.round((i - slices/2) * 0.02 * w * -0.05) // small shift to center => slimming
      ctx.drawImage(off, sx, 0, sw, h, sx + dx, 0, sw, h)
    }
    setStatus('body-slim-applied')
  }

  async function faceTrack(){
    if(!faceModel){
      setLoadingModel(true); setStatus('loading-face')
      const fld = await import('@tensorflow-models/face-landmarks-detection')
      await import('@tensorflow/tfjs')
      faceModel = await fld.load(fld.SupportedPackages.mediapipeFacemesh)
      setLoadingModel(false); setStatus('face-ready')
    }
    const c = canvasRef.current; const ctx = c.getContext('2d')
    const preds = await faceModel.estimateFaces({input:c})
    ctx.strokeStyle='red'; ctx.lineWidth=2
    preds.forEach(p=>{
      const coords = p.scaledMesh || []
      if(coords.length){
        const xs = coords.map(x=>x[0]), ys = coords.map(x=>x[1])
        const minX = Math.min(...xs), maxX = Math.max(...xs)
        const minY = Math.min(...ys), maxY = Math.max(...ys)
        ctx.strokeRect(minX,minY,maxX-minX,maxY-minY)
      }
    })
    setStatus('face-tracked')
  }

  return (
    <div>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}} className="controls">
        <input type="file" accept="image/*" onChange={handleFile} />
        <button onClick={()=>applyChromaKey(prompt('hex color','#00ff00'), Number(prompt('threshold', '70')))}>Green Screen</button>
        <button onClick={bodySlim}>Body Slim (demo)</button>
        <button onClick={faceTrack}>Face Track</button>
        <button onClick={()=>exportCanvasAsPNG(canvasRef.current)}>Export PNG</button>
        {loadingModel && <span className="spinner">Loading model...</span>}
        <span className="small">{status}</span>
      </div>

      <div style={{display:'flex',gap:16}}>
        <div>
          <div className="canvas-wrap">
            <canvas ref={canvasRef} />
          </div>
        </div>

        <div style={{width:260}}>
          <h4>Stickers</h4>
          <StickersPanel packs={packs} onAdd={addSticker} />
          <div style={{marginTop:12}}>
            <p className="small">Double-click a sticker to remove it. Drag to move.</p>
            <div style={{position:'relative',minHeight:200}}>
              {stickers.map((s,i)=>(
                <StickerItem key={i} sticker={s} onUpdate={(u)=>updateSticker(i,u)} onRemove={()=>removeSticker(i)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
