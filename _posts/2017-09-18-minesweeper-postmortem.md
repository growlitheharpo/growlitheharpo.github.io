---
title: Artificial Opponents - Minesweeper Post-Mortem
layout: blogpost
author: James Keats
selectedurl: Blog
tags: programming college ai
---
Our competition for the Minesweeper AIs has concluded, and the results are in!

<!--more-->

For this competition, our board sizes were:

| Size  | Width | Height | Number of Mines |
|---|---|---|---|
| Small | 9 | 9 | 10 |
| Medium | 16 | 16 | 40 |
| Large | 30 | 16 | 99 |

For these sizes, we did several runs. One "playthrough" involved 10 large games, 40 medium games, and 50 small games. Another involved 5 large, 5 medium, and 10 small. The results can be found below:

![](/assets/img/blog/artificial-opponents/minesweeper_results.png){: .center-image }

Essentially, while not the best in the class, my AI performed very well. I found it did best on the medium boards, while other AIs performed better on the large boards. Although the "Tank algorithm" rescued it in a few different positions and was occasionally able to rescue a board that otherwise would've been lost, it often hung up the program. Still, in the competition that favored medium games over large, mine was able to jump from fourth place to second (although still with a considerable gap to first).

The AI performed worst in situations where it did not hit a "0" spot to begin, and was forced to content with a bunch of "islands" from random guessing and couldn't fill in a significant portion of information. In cases like this, it was never able to get any sort of foothold on the board and so inevitably lost very quickly without revealing many cells.

However, on boards where it was able to get some sort of foothold and begin opening a large number of cells, it generally performed very well. It was able to get such high scores by revealing large portions of the board through the simple algorithm and using the click queue helped speed it up significantly.

The biggest issue with this AI was the lack of speed with the "Tank" algorithm. Given more time, I would've liked to balance it a bit more, and implement better "segregation" techniques that would allow it to run faster. I also thought about how to potentially provide it with some sort of heuristic that allowed it to consider "better" options or skip out of bad ones sooner to help avoid the number of recursions it had to do.

Overall, I am happy with second/third/fourth place (depending on how you weight the scores). The competition was fun and full of talented programmers, and I'm looking forward to the next game: Gin Rummy!
