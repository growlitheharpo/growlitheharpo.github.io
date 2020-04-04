---
title: Artificial Opponents - Minesweeper Planning
layout: blogpost
author: James Keats
selectedurl: Blog
---

My plan for Minesweeper is to follow the general approach outlined by Bai Li (luckytoilet) in the blog post “[How to Write your own Minesweeper AI](https://luckytoilet.wordpress.com/2012/12/23/2125/)” which is also linked to in the references section.

The basic idea is to use a simple minesweeper algorithm that most players use in their head at first and, if that fails, to use a more complicated algorithm that enumerates all the possible states and finds common cells between all of them to make a decision. When this also fails, it must fall back on guessing, just like real minesweeper.

The data will be stored in the AI’s own game view class. This class will represent only the knowledge that the AI or a player would know about the game from looking at the board, plus the knowledge provided by the game (such as the mine count).

<!--more-->

### Major Classes

**AIGameView**

* Will keep track of the known board state in a BoardState.
* Will hold a queue of cells that are known to be clickable.
* Will create mutable copies of the board as necessary and only modify the main copy when a click has occurred or a mine can be flagged.

**BoardState**

* Will hold an array of bytes with indexes that match those of the main game.
 * A value of -2 means the cell has been flagged as a mine.
 * A value of -1 means the cell is unknown.
 * A value >= 0 represents the adjacent mine count of the cell.
* Will hold the total number of mines and the current number of flagged mines, and provide a function for checking how many mines remain unflagged.

**Major Algorithms**

Essentially, we will follow the approach outlined in Bai Li's blog:

* First, we do the “simple approach”:
  * For every cell with a number, subtract 1 from its count for each known mine around it.
  * For every cell with a count of 1 and exactly one unknown cell adjacent to it, flag that unknown cell as a mine.
  * For every cell with a count of 0 (after subtracting for known mines), we can click on every adjacent unknown cell.
* If we reach a situation where the simple approach cannot get us any further, we use what Bai Li calls the “Tank Algorithm”:
  * Enumerate all possible positions that are valid based on the known board state.
  * Check what is common between them.
    * Any cells that are always empty in all possible configurations can immediately be clicked.
    * Any cells that are always mines in all possible configurations can immediately be flagged.
  * If no changes occurred from the previous step, we can use things that are common between all the possible positions to determine probabilities.
    * The cell that has mines in the fewest number of combinations can be clicked. If there is a situation where multiple cells have the same lowest probability of being a mine, the one with the lowest index will be chosen.

At any given time, if the algorithm determines there are multiple cells that can be clicked, they will be added to a queue of cell indexes. The algorithm will only run when the queue is empty.

#### References

Li, Bai. “How to Write your own Minesweeper AI”. Dec 23, 2012. [https://luckytoilet.wordpress.com/2012/12/23/2125/](https://luckytoilet.wordpress.com/2012/12/23/2125/)