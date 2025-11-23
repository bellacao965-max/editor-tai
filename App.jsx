import React, { useState } from 'react'
import ImageEditor from './components/ImageEditor'
import VideoEditor from './components/VideoEditor'
import AvatarGen from './components/AvatarGen'

export default function App(){
  const [mode, setMode] = useState('image')
  return (
    <div className="app">
      <div className="header">
        <h2>Editor Refactor — Web Ready</h2>
        <div style={{marginLeft:'auto'}}>
          <button onClick={()=>setMode('image')}>Image</button>
          <button onClick={()=>setMode('video')}>Video</button>
          <button onClick={()=>setMode('avatar')}>Avatar</button>
        </div>
      </div>

      <div className="panel">
        {mode==='image' && <ImageEditor/>}
        {mode==='video' && <VideoEditor/>}
        {mode==='avatar' && <AvatarGen/>}
      </div>
    </div>
  )
}
