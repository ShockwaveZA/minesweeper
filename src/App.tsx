// import { useState } from 'react'
import './App.scss'
import Board from './board/Board';

function App() {
  // const [count, setCount] = useState(0)

  return (
    <div className="App">
        <h1>Minesweeper</h1>

        <Board w={32} h={16}></Board>
    </div>
  )
}

export default App
