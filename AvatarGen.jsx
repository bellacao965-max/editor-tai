import React, { useRef } from 'react'

export default function AvatarGen(){
  const canvasRef = useRef()

  function load(e){
    const f = e.target.files?.[0]; if(!f) return
    const url = URL.createObjectURL(f)
    const img = new Image(); img.src = url
    img.onload = ()=>{
      const size = 512
      const c = canvasRef.current; c.width = size; c.height = size
      const ctx = c.getContext('2d')
      const min = Math.min(img.width, img.height)
      const sx = (img.width - min)/2, sy = (img.height - min)/2
      ctx.drawImage(img, sx, sy, min, min, 0,0,size,size)
      const d = ctx.getImageData(0,0,size,size)
      for(let i=0;i<d.data.length;i+=4){
        d.data[i] = Math.floor(d.data[i]/32)*32
        d.data[i+1] = Math.floor(d.data[i+1]/32)*32
        d.data[i+2] = Math.floor(d.data[i+2]/32)*32
      }
      ctx.putImageData(d,0,0)
      ctx.globalCompositeOperation = 'destination-in'
      ctx.beginPath(); ctx.arc(size/2,size/2,size/2,0,Math.PI*2); ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
    }
  }

  function download(){
    const c = canvasRef.current
    const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'avatar.png'; a.click()
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={load} />
      <div style={{marginTop:8}}>
        <canvas ref={canvasRef} style={{width:256,height:256,borderRadius:16}} />
      </div>
      <div style={{marginTop:8}}>
        <button onClick={download}>Download Avatar</button>
      </div>
      <p className="small">Client-side demo avatar. For production-grade avatars, run server models (StyleGAN / diffusion).</p>
    </div>
  )
}
