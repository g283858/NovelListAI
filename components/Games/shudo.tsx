import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock } from 'lucide-react';

// 定义类型
type Difficulty = 'easy' | 'medium' | 'hard';
type Board = string[][];
type Position = { row: number; col: number } | null;
type Particle = {
  x: number;
  y: number;
  emoji: string;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
};
type Error = { row: number; col: number };

const EmojiSudoku = () => {
  const emojis = ['🐱', '🐰', '🐼', '🦊'];
  const celebrationEmojis = ['🌸', '⭐', '✨', '🎉', '🌟'];
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [board, setBoard] = useState<Board>([]);
  const [solution, setSolution] = useState<Board>([]);
  const [selected, setSelected] = useState<Position>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errors, setErrors] = useState<Error[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  // 花瓣动画参数生成
  const createParticle = (): Particle => ({
    x: Math.random() * window.innerWidth,
    y: -20,
    emoji: celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)],
    speed: 2 + Math.random() * 3,
    rotation: Math.random() * 360,
    rotationSpeed: -2 + Math.random() * 4,
    opacity: 1,
  });

  // 格式化时间显示
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 检查特定位置是否正确
  const isCellCorrect = (row: number, col: number): boolean => {
    return board[row][col] === solution[row][col];
  };

  // 检查是否在行、列、方块中已存在
  const isValid = (board: Board, row: number, col: number, value: string): boolean => {
    for (let x = 0; x < 4; x++) {
      if (board[row][x] === value) return false;
      if (board[x][col] === value) return false;
    }
    
    let boxRow = Math.floor(row/2) * 2;
    let boxCol = Math.floor(col/2) * 2;
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        if (board[boxRow + i][boxCol + j] === value) return false;
      }
    }
    
    return true;
  };

  // 生成完整的解决方案
  const generateSolution = (): Board => {
    let grid: Board = Array(4).fill([]).map(() => Array(4).fill(''));
    
    const solve = (): boolean => {
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          if (grid[row][col] === '') {
            for (let emoji of emojis) {
              if (isValid(grid, row, col, emoji)) {
                grid[row][col] = emoji;
                if (solve()) return true;
                grid[row][col] = '';
              }
            }
            return false;
          }
        }
      }
      return true;
    };
    
    solve();
    return grid;
  };

  // 创建庆祝动画
  const startCelebration = useCallback(() => {
    const newParticles = Array(30).fill(null).map(createParticle);
    setParticles(newParticles);

    const animateParticles = () => {
      setParticles(prevParticles => 
        prevParticles.map(particle => ({
          ...particle,
          y: particle.y + particle.speed,
          rotation: particle.rotation + particle.rotationSpeed,
          opacity: particle.y > window.innerHeight * 0.7 ? 
            particle.opacity - 0.02 : particle.opacity
        })).filter(particle => particle.opacity > 0)
      );
    };

    const animationInterval = setInterval(animateParticles, 50);
    setTimeout(() => {
      clearInterval(animationInterval);
      setParticles([]);
    }, 5000);
  }, []);

  // 根据难度移除一些数字
  const createPuzzle = (solution: Board, difficulty: Difficulty): Board => {
    let puzzle = JSON.parse(JSON.stringify(solution));
    let cellsToRemove = {
      easy: 6,
      medium: 8,
      hard: 10
    }[difficulty];
    
    while (cellsToRemove > 0) {
      let row = Math.floor(Math.random() * 4);
      let col = Math.floor(Math.random() * 4);
      if (puzzle[row][col] !== '') {
        puzzle[row][col] = '';
        cellsToRemove--;
      }
    }
    
    return puzzle;
  };

  // 检查所有已填写的格子是否正确
  const validateBoard = (): boolean => {
    const newErrors: Error[] = [];
    let hasError = false;
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (board[i][j] !== '' && !isCellCorrect(i, j)) {
          newErrors.push({ row: i, col: j });
          hasError = true;
        }
      }
    }
    
    setErrors(newErrors);
    setShowErrors(true);
    
    if (hasError) {
      setAttempts(prev => prev + 1);
      return false;
    }
    return true;
  };

  // 初始化游戏
  const initializeGame = () => {
    const newSolution = generateSolution();
    const newBoard = createPuzzle(newSolution, difficulty);
    setSolution(newSolution);
    setBoard(newBoard);
    setIsComplete(false);
    setTime(0);
    setIsPlaying(true);
    setParticles([]);
    setErrors([]);
    setShowErrors(false);
    setAttempts(0);
  };

  // 处理单元格点击
  const handleCellClick = (row: number, col: number) => {
    if (board[row][col] === '' && isPlaying) {
      setSelected({ row, col });
    }
  };

  // 处理emoji选择
  const handleEmojiSelect = (emoji: string) => {
    if (selected && isPlaying) {
      const newBoard = [...board];
      newBoard[selected.row][selected.col] = emoji;
      setBoard(newBoard);
      setSelected(null);
      setShowErrors(false);
    }
  };

  // 处理验证按钮点击
  const handleValidate = () => {
    const isValid = validateBoard();
    if (isValid && board.every(row => row.every(cell => cell !== ''))) {
      setIsComplete(true);
      setIsPlaying(false);
      startCelebration();
    } else if (attempts >= maxAttempts - 1) {
      setIsPlaying(false);
      setShowErrors(true);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && !isComplete) {
      timer = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isComplete]);

  useEffect(() => {
    initializeGame();
  }, [difficulty]);

  const getCellClassName = (i: number, j: number): string => {
    const baseClass = "h-16 flex items-center justify-center text-2xl border-2 rounded cursor-pointer transition-colors duration-200";
    const selectedClass = (i === selected?.row && j === selected?.col) ? 'border-pink-500 bg-pink-100' : 'border-pink-200 bg-white';
    const patternClass = (Math.floor(i/2) === 0 && Math.floor(j/2) === 0) || (Math.floor(i/2) === 1 && Math.floor(j/2) === 1) ? 'bg-opacity-50' : '';
    const errorClass = showErrors && errors.some(err => err.row === i && err.col === j) ? 'bg-red-100 border-red-500' : '';
    
    return `${baseClass} ${selectedClass} ${patternClass} ${errorClass} hover:bg-pink-50`;
  };

    const handleDifficultyChange = (value: Difficulty) => {
    setDifficulty(value);
  };

  return (
    <Card className="w-full max-w-md bg-pink-50 relative overflow-hidden">
      <CardHeader>
        <CardTitle className="text-center text-pink-600 text-2xl font-bold mb-4">
          可爱的表情数独
        </CardTitle>
        <div className="flex justify-between items-center mb-4">
          <Select
            value={difficulty}
            onValueChange={handleDifficultyChange}
          >
            <SelectTrigger className="w-32 bg-white border-pink-300">
              <SelectValue defaultValue="easy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">简单</SelectItem>
              <SelectItem value="medium">普通</SelectItem>
              <SelectItem value="hard">困难</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border-2 border-pink-300">
            <Clock className="w-4 h-4 text-pink-500" />
            <span className="text-pink-600 font-mono">{formatTime(time)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={initializeGame} 
            className="flex-1 bg-pink-400 hover:bg-pink-500 font-bold"
          >
            开始新游戏
          </Button>
          {isPlaying && (
            <Button 
              onClick={handleValidate} 
              className="flex-1 bg-blue-400 hover:bg-blue-500 font-bold"
            >
              检查答案
            </Button>
          )}
        </div>
        {showErrors && errors.length > 0 && (
          <div className="mt-2 text-center text-red-500">
            发现 {errors.length} 个错误 (还剩 {maxAttempts - attempts} 次机会)
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {board.map((row, i) => (
            row.map((cell, j) => (
              <div
                key={`${i}-${j}`}
                className={getCellClassName(i, j)}
                onClick={() => handleCellClick(i, j)}
              >
                {cell}
              </div>
            ))
          ))}
        </div>
        
        <div className="flex justify-center gap-4 mb-4">
          {emojis.map(emoji => (
            <Button
              key={emoji}
              onClick={() => handleEmojiSelect(emoji)}
              className="text-2xl bg-white hover:bg-pink-100 border-2 border-pink-200 w-16 h-16"
              disabled={!isPlaying}
            >
              {emoji}
            </Button>
          ))}
        </div>
        
        {isComplete && (
          <div className="text-center text-xl text-pink-600 font-bold mt-4 animate-bounce">
            🎉 太棒了！你完成啦！🎉
          </div>
        )}

        {!isPlaying && attempts >= maxAttempts && !isComplete && (
          <div className="text-center text-xl text-red-500 font-bold mt-4">
            💔 游戏结束了... 要不要再试一次？
          </div>
        )}

        {particles.map((particle, index) => (
          <div
            key={index}
            className="absolute pointer-events-none text-2xl"
            style={{
              left: particle.x,
              top: particle.y,
              transform: `rotate(${particle.rotation}deg)`,
              opacity: particle.opacity,
              transition: 'transform 0.05s linear'
            }}
          >
            {particle.emoji}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default EmojiSudoku;
