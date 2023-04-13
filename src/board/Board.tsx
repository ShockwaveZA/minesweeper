import './Board.scss'
import {useState} from 'react';

interface Tile {
    id: number;
    isMine: boolean;
    mineCount: number;
    revealed: boolean;
    flagged: boolean;
    y: number;
    x: number;
}

function Board(props: any) {
    const { h, w } = props;

    const initialize = (): Tile[][] => {
        let idCounter = 0;
        const grid = [];
        for (let i = 0; i < h; i++) {
            const line = [];
            for (let j = 0; j < w; j++) {
                const tile: Tile = {
                    id: idCounter++,
                    isMine: false,
                    mineCount: 0,
                    revealed: false,
                    flagged: false,
                    y: i,
                    x: j,
                };
                line.push(tile);
            }
            grid.push(line);
        }
        return grid;
    }

    const [board, setBoard] = useState(initialize());
    const [mineCount, setMineCount] = useState(0);
    const [flagCount, setFlagCount] = useState(0);
    const [completed, setCompleted] = useState<any>(null);

    const reset = () => {
        setBoard(() => initialize());
        setMineCount(() => 0);
        setFlagCount(() => 0);
        setCompleted(() => null);
    }


    const getNeighbours = (y: number, x: number, board: Tile[][]): Tile[] => {
        const neighbours = [];
        for (let i = -1; i < 2; i++) {
            if (board[y + i] === undefined) {
                continue;
            }
            for (let j = -1; j < 2; j++) {
                const t = board[y + i][x + j];
                if (t === undefined || t === null) {
                    continue;
                }
                neighbours.push(t);
            }
        }
        return neighbours;
    }

    const calculateMineCounts = (board: Tile[][]) => {
        for (let i = 0; i < h; i++) {
            for (let j = 0; j < w; j++) {
                board[i][j].mineCount = getNeighbours(i, j, board).reduce((acc: number, t: Tile) => acc + (t.isMine ? 1 : 0), 0);
            }
        }
    }

    const addMines = (n: number, yp: number, xp: number, board: Tile[][]) => {
        setMineCount(() => n);
        let minesAdded = 0;
        while (minesAdded < n) {
            const x = Math.round(Math.random() * (w - 1));
            const y = Math.round(Math.random() * (h - 1));

            if (board[y][x].isMine || (Math.abs(x - xp) < 2 && Math.abs(y - yp) < 2)) {
                continue;
            }

            board[y][x].isMine = true;
            minesAdded++;
        }

        calculateMineCounts(board);
    }

    const updateFlagCount = (newBoard: Tile[][]): void => {
        setFlagCount(() => {
            return newBoard.reduce((rmc: number, row: Tile[]) => {
                return rmc + row.reduce((mc, tile) => mc + (tile.flagged ? 1 : 0), 0);
            }, 0);
        })
    }

    const allFreeSpacesUncovered = (board: Tile[][]): boolean => {
        for (const row of board) {
            for (const tile of row) {
                if (!tile.isMine && !tile.revealed) {
                    return false;
                }
            }
        }
        return true;
    }

    const flagAllMines = (board: Tile[][]): void => {
        for (const row of board) {
            for (const tile of row) {
                if (tile.isMine) {
                    tile.flagged = true;
                }
            }
        }
    }

    const revealUnflaggedMines = (board: Tile[][]): void => {
        for (const row of board) {
            for (const tile of row) {
                if (tile.isMine && !tile.revealed && !tile.flagged) {
                    tile.revealed = true;
                }
            }
        }
    }

    const rows = () => {
        const click = (item: Tile, y: number, x: number) => {
            if (completed != null) {
                return;
            }

            const newBoard = JSON.parse(JSON.stringify(board));

            if (newBoard[y][x].flagged) {
                return;
            }

            if (newBoard[y][x].revealed) {
                let q = getNeighbours(y, x, newBoard);
                const flagCount = q.reduce((acc, tile) => acc + (tile.flagged ? 1 : 0), 0);
                if (flagCount === newBoard[y][x].mineCount) {
                    while (q.length) {
                        const [tile, ...rest] = q;
                        if (tile.revealed || tile.flagged) {
                            q = rest;
                            continue;
                        }
                        tile.revealed = true;
                        if (tile.mineCount === 0) {
                            q = [...rest, ...getNeighbours(tile.y, tile.x, newBoard)];
                        }
                    }
                }
            }

            const clickedFirst = newBoard?.reduce((isFirst: boolean, row: Tile[]) => {
                if (!row.reduce((isFirstInRow: boolean, tile: Tile) => !isFirstInRow ? isFirstInRow : !(tile.revealed), true)) {
                    return false;
                }
                return isFirst;
            }, true);
            if (clickedFirst) {
                addMines(Math.round(0.2 * 32 * 16), y, x, newBoard);
            }

            newBoard[y][x].revealed = true;

            if (!newBoard[y][x].isMine && newBoard[y][x].mineCount === 0) {
                let q = getNeighbours(y, x, newBoard);
                while (q.length) {
                    const [tile, ...rest] = q;
                    if (tile.revealed) {
                        q = rest;
                        continue;
                    }
                    tile.revealed = true;
                    if (tile.mineCount === 0) {
                        q = [...rest, ...getNeighbours(tile.y, tile.x, newBoard)];
                    }
                }
            }

            if (newBoard[y][x].isMine) {
                revealUnflaggedMines(newBoard);
                setCompleted(() => false);
            }
            else if (allFreeSpacesUncovered(newBoard)) {
                flagAllMines(newBoard);
                updateFlagCount(newBoard);
                setCompleted(() => true);
            }

            setBoard(() => newBoard);
        };

        const rightClick = (e: any, tile: Tile, y: number, x: number) => {
            e.preventDefault();
            if (completed != null) {
                return;
            }

            const newBoard = JSON.parse(JSON.stringify(board));
            if (newBoard[y][x].revealed) {
                return;
            }
            newBoard[y][x].flagged = !newBoard[y][x].flagged;
            updateFlagCount(newBoard);
            setBoard(() => newBoard);
        };

        const printRow = (row: Tile[], y: number) => row?.map((tile, x) => {
            let content = null;
            let classes = ['cell'];

            if (!tile?.revealed) {
                classes.push('hidden');
            }

            if (tile.flagged) {
                content = (<img className='flag' alt='flag' src='src/assets/flag.svg' />);
            }
            else if (tile.revealed) {
                if (tile.isMine) {
                    content = (<img className='mine' alt='mine' src='src/assets/mine.svg' />);
                }
                else {
                    // @ts-ignore
                    if (tile?.mineCount > 0) {
                        content = tile.mineCount;
                    }
                    classes.push(`cell-color-${tile.mineCount}`)
                }
            }

            return (<span key={y * 100 + x} className={classes.join(' ')} onClick={() => click(tile, y, x)} onContextMenu={e => rightClick(e, tile, y, x)}>{ content }</span>);
        });

        const rows = board.map((line: Tile[], index: number) => (<div key={'line' + index} className="row">{ printRow(line, index )}</div>))

        return (<div className="container">{ rows }</div> );
    }

    return (
        <div>
            <div className='info'>
                <button onClick={() => reset()}>{completed ? 'New Game' : 'Start Over'}</button>
                <div className='count'><img alt='flag' src='src/assets/flag.svg' /> {flagCount} / {mineCount}</div>
            </div>
            <div className="Board">
                { rows() }
            </div>
        </div>
    )
}

export default Board;