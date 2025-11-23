import React, { useRef } from 'react'

export default function StickerItem({sticker, onUpdate, onRemove}){
  const ref = useRef()
  function onMouseDown(e){
    e.preventDefault()
    const startX = e.clientX, startY = e.clientY
    const orig = {...sticker}
    function move(ev){
      const dx = ev.clientX - startX, dy = ev.clientY - startY
      onUpdate({...sticker, x: orig.x + dx, y: orig.y + dy})
    }
    function up(){ window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
  }
  return (
    <img
      ref={ref}
      src={sticker.src}
      alt=""
      className="sticker-dom"
      style={{left:sticker.x, top:sticker.y, width:sticker.w, height:sticker.h, transform:`rotate(${sticker.rot || 0}deg)`}}
      onMouseDown={onMouseDown}
      onDoubleClick={()=>onRemove()}
    />
  )
}
