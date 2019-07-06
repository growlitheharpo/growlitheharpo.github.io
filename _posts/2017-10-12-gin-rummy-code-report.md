---
title: Artificial Opponents - Gin Rummy - Code Report
layout: blogpost
author: James Keats
selectedurl: Blog
---
#### General Approach

The AI keeps track of cards discarded, discarded cards drawn, and how many cards are left in the deck, among other things. This allows it to make educated decisions about what to do next based on a utility scoring system. This approach has been very successful against the "test Dummy" DLL we were given to start, often receiving 2-3 times the total end score when playing one-on-one, with a smaller margin but still consistent win rate against larger pools of opponents.

<!--more-->

#### Classes Used

**AIDiscardPile**
* AI View version of the discard pile.
* Based on std::stack.
* Utility functions to check if it contains a given card, and to see what the most recent discard of the opponent that directly follows this AI was (useful to avoid helping the next player).

<p></p>

**FuzzyCardCollection**
* Tracks a semi-known collection of cards (like the main deck, or other players' hands).
* Has two collections of cards: known cards, and possible cards.
    * A known card is one we know for a fact is present in the collection (such as when an AI draws a card from the discard pile).
    * A possible card is one that we believe could be contained in the collection.
    * Cards are only removed from the possibility list when they are discarded, or picked up by this AI.
* Has utility functions such as "bool canHaveCard(Card c)" and "float chanceOfCard(Card c)".

<p></p>

**AIGameView**
* Used to track all of the data.
    * Contains a std::vector of FuzzyCardCollections, one per opponent hand.
    * Contains a FuzzyCardCollection to track the main deck.
    * Contains a AIDiscardPile instance.
    * Also keeps a copy of the player's (known, and thus not Fuzzy) hand, as well as the player's ID.
* Receives all the events from the game (CardPlayedEvent, CardDrawnEvent, CardPassedEvent, PassCardRequest, DrawCardRequest, and DiscardRequest).
* Uses a group of external free utility functions to make a decision and then pass it along to the game.

<p></p>

#### Algorithms Used
<p>
    <div class="flex flex-wrap">
        <div class="w-full md:w-1/2">
            <p>
                <img class="mx-auto" src="/assets/img/blog/artificial-opponents/gin-rummy-1.jpg" style="width: 340px;">
            </p>
        </div>
        <div class="w-full md:w-1/2">
            <p>
                <img class="mx-auto" src="/assets/img/blog/artificial-opponents/gin-rummy-2.jpg" style="width: 340px;">
            </p>
        </div>
    </div>
</p>

The fun part of creating the Gin Rummy AI was reducing the utility functions for each card down to something that could quickly and easily be determined and tweaked. The above whiteboard images were taken during the brainstorming process when I was first trying to determine what steps the AI would follow when scoring each card. The end result is as follows:

###### Drawing a Card
1. Look at the card at the top of the discard pile.
2. If it will complete a meld, add 20 points.
3. If it is a mid-range card (6-9, considered valuable), add 9 points.
4. Subtract the amount of deadwood a card of this value gives.
5. If we're in the late game, subtract another point.
6. Run the "discard" algorithm. If we'd immediately get rid of this card, subtract 1000 points.

The result of this algorithm is that realistically, the AI only draws from the discard pile when it would complete a meld, or if it sees a useful card within the first few turns (which is unlikely as the other AIs generally only discard high-value cards). This is realistic and useful behavior.

###### Discarding/Passing

The discard algorithm is slightly more complicated. First, **we remove all melds from the hand we are evaluating**. Then, the following process is followed for every card, resulting in a score. After every card is evaluated, we choose and return whichever card in the hand ended with the highest score.</p>

For each card:
1. **Add** the deadwood value of this card.
2. If the card is in a pair:
    1. If both of the other cards of this value "might" be in the deck (i.e., have not been discarded), **subtract** half the deadwood value.
    2. If only one of the other cards "might" be in the deck (i.e., one has been discarded already), **subtract** deadwood value divided by half the number of cards in the deck (because there is a much smaller chance we will complete this set).
    3. If both cards have been discarded, **add** half of the deadwood value because this card is unlikely to be useful.
3. If we have a card of one value higher or lower in the same suit (i.e., a partial run):
    1. If either of the cards that might complete the run are in the deck, **subtract** a third of the deadwood value.
    2. If both cards have been discarded, **add** 75% of the deadwood value.
4. If our next opponent just discarded a card of the same value in a different suit (i.e., we know they are not trying to make a set with this card), **add** 75% of the deadwood value.
5. If our next opponent just discarded a card of a different suit plus or minus one value, **add** the deadwood value.

This algorithm is roughly equivalent to most of what the Gin Rummy strategy guides linked to last week suggest to do. What's more, it is very simple to implement and only relies on the following collection of simple utility functions:

{% highlight cpp %}
Hand cloneAndStripMelds(const Hand& h);
 
bool isInMeld(Card c, const Hand& h);
bool isInPair(Card c, const Hand& h);
bool isInPartialRun(Card c, const Hand& h);
bool mightExistInDeck(Card c, const FuzzyCardCollection& deck);
 
int getDeadwoodValue(Card c);
 
std::pair<Card, Card> getPairMissingTwo(Card c, const Hand& h);
std::pair<Card, Card> getRunMissingTwo(Card c, const Hand& h);
{% endhighlight %}

Overall, I'm expecting this AI to perform very well in the competition. Its performance is consistent, and it is intelligent enough to win the majority of the games it is thrown into already.
