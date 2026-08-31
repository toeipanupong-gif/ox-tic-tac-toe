"use client";

import Cell from "./Cell";

export default function Board({
  board,
  onCellClick,
  disabled,
  winningLine = [],
  lastMoveIndex = null,
}) {
  return (
    <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-3">
      {board.map((value, index) => (
        <Cell
          key={`${index}-${value ?? "empty"}`}
          value={value}
          onClick={() => onCellClick(index)}
          disabled={disabled}
          highlight={winningLine.includes(index)}
          animate={lastMoveIndex === index}
        />
      ))}
    </div>
  );
}
