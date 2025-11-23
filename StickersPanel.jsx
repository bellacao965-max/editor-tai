import React from 'react'

export default function StickersPanel({packs, onAdd}){
  return (
    <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
      {packs.map((p,i)=>(
        <img key={i} src={p} width={48} style={{cursor:'pointer',borderRadius:6}} onClick={()=>onAdd(p)} />
      ))}
    </div>
  )
}
