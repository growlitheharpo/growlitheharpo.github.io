---
title: Artificial Opponents - Minesweeper Code Report
layout: blogpost
author: Allie Keats
selectedurl: Blog
published: false
tags: programming college ai
---
As was planned in the planning post, I approached Minesweeper in a similar way o what was outlined by Bai Li (luckytoilet) in the blog post "How to Write your own Minesweeper AI".

Essentially, the most basic minesweeper strategy is used first: find all cells that can be flagged as ines or known to be clear using basic arithmetic (i.e., if a cell has a count of 1 and 1 mine is already flagged next to it, all others can be revealed; if a cell has a count of 1 and only 1 unknown neighbor, the unknown cell must be a mine).

If this approach fails, we use the brute force "Tank algorithm" described by Bai Li, which recursively determines all valid states of the board, then uses commonalities between the possible valid states to make its next move.

This method has been very successful against the default configurations that we were given for initial testing.

<!--more-->

### Classes Used
Classes Used

#### BoardState

This holds an array of bytes that represent the state of the board as the AI or player would see t.

* A value of -2 means the cell has been flagged as a mine.
* A value of -1 means the cell is unknown.
* A value >= 0 represents the adjacent mine count of the cell.

It also holds the width and height of the board, as well as the flag count, the mine count, and he count of all revealed cells.

#### AIGameView

This class holds a "master" instance of BoardState which represents the actual state of the game. It also holds a queue of cells that are known to be clickable.

#### Free Functions

The "Tank Algorithm" outlined below exists as a set of free functions in order to make the IGameView class cleaner.

The following process is followed when the DLL receives a request for a click from the main game:

![](/assets/img/blog/artificial-opponents/minesweeper_flowchart.png){: .center-image }

A simplified version of this flow:

* AI gets a click request from the game.
* If there are safe cells already in our queue, go no further and use those. Otherwise...
* If it's our first click, go no further and choose a random cell. Otherwise...
* Copy the master game state from the game.
* Attempt to flag mines and fill the queue using basic arithmetic and known mines/counts.
* If there are safe cells in the queue from this method, go no further and use those. Otherwise...
* If there aren't many cells revealed (5 was chosen as a limit), go no further and choose a random ell. Otherwise...
    * Begin the tank algorithm:
    * Make a list of all unknown cells that border a known cell.
    * Begin a recursive call that checks every possible combination of mine/empty for the list of unknown cells. Whenever a combination that is valid based on our known data is found, add it o a list of solutions.
    * When the recursive call completes, loop through all border cells. If there are any that are ines in every valid solution, flag them as a mine. If there are any that are empty in every valid solution, add them to the clickable queue. Go no further, and use those.
* If no cells have been clicked, use the number of times each cell was empty divided by the umber of valid solutions to determine a "probability" that each cell is empty. Choose the ell with the highest probability of being empty, add it to the queue, and use it.

#### Compromises & Expectations

One of my hopes was to multithread the Tank Algorithm as each recursive call is able to rely entirely on method arguments, although it needs to push valid solutions into a global queue. In the end, I decided to abandon this idea because the complexity involved in getting it working was taking too much time. For reasons I never determined, the recursion failed after a depth of only 2 or 3 when running on threads, never reaching the much lower depths needed to solve the problem. It is also possible that this solution would not have provided any real performance boost in the end anyway, given how expensive it is to create and join threads.

Partially because I was never able to get the multithreading working, I introduced limits on the tank algorithm to avoid it freezing the game for long stretches of time. The length of the border list it's checking has a significant impact on the time it takes; in fact, it runs at O(2^n). I decided through testing that it should abandon using this algorithm if the length of this list is greater than 20, and even that involves 1,048,576 function calls which briefly seizes the game. In a similar vein, I choose to not even attempt the tank algorithm if less than 5 cells have been revealed. A quantity this small implies we are in the early stages of the game and the AI has so far clicked cells that only revealed a single data point, meaning the algorithm would not be ble to find any valid solutions, and it is not worth the time to run it.

This AI has performed very well against the configurations were were provided for testing, which included the following boards: 25x25 w/ 40 mines, 12x12 w/ 7 mines, and 7x7 w/ 4 mines. The win percentage in these scenarios hovers between 80-90%, and it runs very quickly. My hope is that these statistics will hold up to some degree with whatever values are used for the competition in-class.

References
Li, Bai. “How to Write your own Minesweeper AI”. Dec 23, 012. [https://luckytoilet.wordpress.com/2012/12/23/2125/](https://luckytoilet.wordpress.com/2012/12/23/2125/)