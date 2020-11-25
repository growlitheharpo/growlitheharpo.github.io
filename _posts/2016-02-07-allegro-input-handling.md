---
title: Allegro Input Handling
layout: blogpost
author: James Keats
selectedurl: Blog
published: false
tags: programming college game-architecture
---

For our most recent assignment in Game Architecture, we had to build some wrapper/abstraction classes for an Allegro framework. The important key was that this not be a leaky abstraction--that the outside user not require any knowledge of Allegro or its functions in order to use our code. Technically this assignment only required us to have very basic input, allowing the outside code to determine if the user was pressing "F", "S", and the location of the mouse cursor. I decided instead, having finished the rest of the assignment quite quickly, to write a full input handler.

<!--more-->

#### Determining Our Needs

Our needs here are fairly simple:

* We want to know whether a key is currently pressed, if it was pressed this frame, or if it was released this frame.
* We want to know the same 3 pieces of information, but about the mouse buttons.
* We want to know the location of the mouse.
* We do not want to expose any Allegro to the caller.

#### First Thoughts

The first thing I did was simple; I created an InputManager class, and inside of that I made an enum class for KeyCode, and one for MouseCode. The values for this were identical to the Allegro values for the equivalent keys, but enum classes are type safe which is always a nice bonus, and it seals the Allegro to InputManager.

For getting the different states of the keys, I set up an Allegro event queue and registered the keyboard as an event source (and set up a separate one for the mouse--for pretty much everything I'm saying from this point forward,  I'm going to talk about the keyboard but you can safely assume I did the same thing for the mouse). I then set up an update function called from the main game loop that would go through the queue and set the values for the keys.

I stored the values in three boolean arrays--one for "Just Pressed", one for "Currently Pressed", and one for "Just Released". The logic went as follows:

* Set the entire "Just Pressed" array and the entire "Just Released" array to false. These are what I call single-frame flags, and so the first thing an update should do is clear the values from the last frame.
* Loop through the entire event queue:
  * When we find a key down event, set "just pressed" and "currently pressed" to true for that key.
  * When we find a key up event, set "currently pressed" to false and "just released" to true.

This setup works perfectly fine, and I didn't have any problems with it, except that I had a sneaking suspicion that having three arrays of booleans was a little bit wasteful. After all, I had three valuesand they could only be true or false. Every single one of those bytes that I was allocating had 8 bits, 7 of which were sitting there totally unused. That starts to add up.

#### Bitwise Operations and Flags

Full disclosure: I have never worked with bitwise operators before. I took Discrete Mathematics at Champlain, but prior to taking on this task as a side-project, I had never used them in programming. However, I knew I wanted to pack these three states into a single byte for every key, saving two bytes for each key and reducing my unused bits from 21 to 5. Is this a huge gain? Admittedly, not really. But it was a good learning experience, if nothing else.

So, I deleted my three boolean arrays, and replaced them with a single byte_t array (byte_t is in this case a typedef for an unsigned char). Then I looked up some truth tables.

| Byte 1 | Byte 2 | Op | Result |
|---|---|---|---|
| 1111 | 0010 | & | 0010 |
| 0011 | 1101 | & | 0001 |
| 1100 | 0001 | &nbsp;&#124; | 1101 |

The first thing I noticed was that bitwise AND (&) was useful for "subtraction". In other words, for either reducing a complex byte to a simple one to see if a certain flag is set within the complex one (Row 1). NOT combined with AND would be useful for "subtracting" a certain bit or flag from a complex byte (Row 2). Meanwhile, bitwise OR ( ;&#124; ) would be useful for "addition", or adding a flag into a byte without affecting the rest of it.

To this end, I declared three main flags, listed to the right. These, plus a byte for each key, were all that was actually necessary for maintaining the state of each key. If the first bit was set, the key was just pressed; the second bit would be if it was currently pressed, and the third for if it was just released. The rest of the bits are unfortunately unused--maybe the next step will be to figure out a way to place two keys on a byte?

The logic of the update loop used here is essentially the same as before, but instead of setting boolean values, I'm 
setting and clearing flags for each key:

{% highlight cpp %}
void InputManager ::updateKeyboard()
{
    //Clear single-frame flags
    for (int i = 0; i < static_cast<int>(KeyCode::MY_MAX_KEY); i++)
    {
        //bitwise "and" the bitwise not == "subtract" that bit
        mBitwiseKeyStates[i] &= (~StateBitValues::JUST_PRESSED & ~StateBitValues::JUST_RELEASED);
    }

    //Loop over all recorded key events this frame
    while (!al_event_queue_is_empty(mpKeyboardEventQueue))
    {
        al_get_next_event(mpKeyboardEventQueue, &mEvent);
        int key = mEvent.keyboard.keycode;

        if (mEvent.type == ALLEGRO_EVENT_KEY_DOWN)
        {
            //If it was just pressed, set the two pressed flags for that key
            mBitwiseKeyStates[key] |= StateBitValues::JUST_PRESSED;
            mBitwiseKeyStates[key] |= StateBitValues::CURRENTLY_PRESSED;
        }
        else if (mEvent.type == ALLEGRO_EVENT_KEY_UP)
        {
            //If it was just released, clear the pressed flag
            //and set the just released flag
            mBitwiseKeyStates[key] &= ~StateBitValues::CURRENTLY_PRESSED;
            mBitwiseKeyStates[key] |= StateBitValues::JUST_RELEASED;
        }
    }
}
{% endhighlight %}

Truth tables are very useful here.

The first for loop combines NOT JUST_PRESSED with NOT JUST_RELEASED (which equals 1010) and then performs an &= (AND EQUALS) operation on each key. In other words, it will maintain the value of the first and third bit for every key (unused, and currently pressed), but will set the other two bits to 0.

| Identifier | Hex | Binary |
|---|---|---|
| JUST_PRESSED | 0x1 | 0001 |
| CURRENTLY_PRESSED | 0x2 | 0010 |
| JUST_RELEASED | 0x4 | 0100 |


Then, the while loop goes through the event queue.

For a key down event, &#124;= (OR EQUALS) will set the bit for that flag. (0000 &#124; 0001 = 0001 then 0001 &#124; 0010 = 0011).
For a key up event, ~&= (NOT AND EQUALS) clears the currently pressed flag, then &#124;= (OR EQUALS) sets the just released flag. (0010 & ~0010 = 0000, then 0000 &#124; 0100 = 0100).

There's one other issue here that's missed--the getters. In order to meet our needs, the following are needed:

* bool getDown(KeyCode key)
* bool getPressed(KeyCode key)
* bool getReleased(KeyCode key)

In the original version, all that's needed for these to work was to return the value in their respective boolean arrays at the index referenced by the KeyCode. Moving to bitwise requires a tiny bit more work, but luckily we already discussed the principals necessary. I'll give you a hint; it's in the first row of the first table up there.

{% highlight cpp %}
bool InputManager::getHasByte(const byte_t value, const byte_t comparison) const
{
    return (value & comparison);
}
{% endhighlight %}

So there you have it. All of this work saved my assignment a total of 454 bytes while running (2 bytes per key * 277 keys, which is ALLEGRO_KEY_MAX). This isn't hugely significant, but the important part is that I now know how to cram multiple flags into a single byte if/when I need to, instead of having multiple boolean values. If there were more flags and even more keys, the memory saved would be even higher. All in all, I think this was a useful exercise.
