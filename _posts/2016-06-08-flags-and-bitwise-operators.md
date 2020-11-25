---
title: Flags and Bitwise Operators
layout: blogpost
author: James Keats
selectedurl: Blog
published: false
tags: programming college game-architecture
---
Since writing my post about Allegro input handling, I've learned a lot more about bitwise operations, setting and masking bits, and how this can be useful. Most importantly, I've learned a bit more terminology than I knew when I started (thanks, Professor Brian Hall).

I'm still quite a ways from being able to show off my main project for the summer, but I'd like to get this one helpful, data-saving piece out there. That would be my series of Flag classes (which is really just one class).

<!--more-->

#### What Are Flags Useful For?

There are probably a lot of things that flags are useful for that I haven't even realized, but there's one main thing I've been using them for: combining independent boolean values. For example, with my Input Manager class I used a flag for every key to track if it was pressed that frame, was currently pressed, or was released that frame. Released could never be true at the same time as the other two, but currently pressed and just pressed could both be true. What would otherwise have to be three seperate bytes for each key was compressed into just a single byte for each through the use of bit flags. At the time, I just used a bare byte_t type (which was a typedef for an unsigned char or an __int8) but I decided that I should extend that a bit to make it more clear what was going on.

#### Flag.h

Here's the entirety of the header:

{% highlight cpp %}
#pragma once

template <typename T>
class IFlag
{
    private:
        T mVal;
 
    protected:
        IFlag() { mVal = 0; }

    public:
        virtual ~IFlag() {}

        void set(T flag)     { mVal |= flag; }
        void clear(T flag)   { mVal &= ~flag; }
        void clearAll()      { mVal = 0; }
             
        bool isSet(T mask) const   { return (mVal & mask); }  //Causes C4800 warning
        bool b_isSet(T mask) const { return (mVal & mask) != 0; } //No warning

        IFlag& operator = (const IFlag& rhs) { mVal = rhs.mVal; return *this; }
};

class Flag8  : public IFlag<__int8> {};
class Flag16 : public IFlag<__int16> {};
class Flag32 : public IFlag<__int32> {};
class Flag64 : public IFlag<__int64> {};
{% endhighlight %}

#### Setting and Clearing
Essentially, there is a base interface that has functions for setting a flag, clearing a flag, and clearing all; I'll talk about the "isSet()" and warnings below. The constructor for the interface is protected so that it isn't instantiated directly. Then, at the bottom, there are 4 actual "types" of flags that can be used--one 8-bit version, 16-bit, 32-bit, and 64-bit. 

| Start | Flag  | Op | Result
|---|---|---|---|
| 0000 | 0100 | &#124;= | 0100
| 0100 | 0001 | &#124;= | 0101
| 0101 | 0001 | &#124;= | 0101

In order to set flags, the bitwise OR operator (the single bar) is used. In this case, we use  &#124;= which works exactly how you'd expect; just like m += n is shortand for m = m + n, m  &#124;= n is shorthand for m = m  &#124; n.

The best way to explain how bitwise OR works is to look at the table. Any bit in the original that is 1 will still be 1; any bit that was 0 in the original but is 1 in the flag will be set to 1 in the original.

To clear a flag, we use the bitwise AND operator (the single ampersand) and the bitwise NOT (the tilde).

We use bitwise NOT to flip the bits and turn the flag into the opposite of its usual value; the result of this is that only the bit pertaining to that flag is 0 and all others are 1. Using the AND operator, any bits that are 0 in the right-hand operator will be 0 in the result; all 1s in the right-hand operator will retain their original value.

| Start | Flag | Op | ~Flag |  Result |
|---|---|---|---|---|
| 1111 | 0100 | &=~ | 1011 | 1011 |
| 0001 | 0001 | &=~ | 1110 | 0000 |
| 0101 | 0001 | &=~ | 1110 | 0100 |

To check if we contain a specific flag or mask, we again use bitwise AND. Essentially, if the given flag is not true, the result of the AND operation will be 0 or false. If the given flag is true, we will get a non-zero result (specifically, we will get the value of the flag back) which, in a way, is true. However, as I mentioned before, Microsoft doesn't like this.

Implicitly casting 0 to false makes sense, but any non-zero value to true is a holdover from C days, and Microsoft wants none of it in their modern C++ world. If you attempt to use (mVal & mask) as a boolean value, you will get a C4800 warning when compiling with VC++. This goes away if you make the value an actual boolean (i.e., (mVal & mask) != 0). A cast won't work here, you need to add the != comparison.

My initial gut reaction was to use a #pragma directive to disable the warning, because I figured that it would be better to skip the extraneous comparison. After all, isn't any non-zero value "true"? Not so, according to a Stack Overflow user who was more ambitious than I. [This user dug into the disassembly](http://stackoverflow.com/a/206632), and found that not using the comparison forces the compiler to jump through some hoops to convert the value to a 0 or a 1, and these are the only values it will accept if it's trying to return a boolean. This is why C4800 is a performance warning--it's actually better to add the comparison.

#### An Example Use

Here's an example from a temporary placeholder class I'm using in my current project to test individual components before I start actually building a game from them.

{% highlight cpp %}
//Header file
class TempPlayerHolder
{
    private:
        Sprite* mpSprite;
        RectangleCollider* mpCollider;
        PhysicsComponent* mpPhysicsComponent;
 
        Flag8 mMoveState;
        enum MOVE_FLAGS
        {
            MOVE_LEFT = 1,
            MOVE_RIGHT = 2,
            MOVE_JUMP = 4,
        };

        //...
}

//Cpp file
void TempPlayerHolder::moveLeft()
{
    mMoveState.set(MOVE_LEFT);
}

void TempPlayerHolder::moveRight()
{
    mMoveState.set(MOVE_RIGHT);
}

void TempPlayerHolder::jump()
{
    mMoveState.set(MOVE_JUMP);
}

void TempPlayerHolder::update()
{
    if (mMoveState.isSet(MOVE_LEFT))
        mpPhysicsComponent->addForce(Vector2(-20.0f, 0.0f));

    if (mMoveState.isSet(MOVE_RIGHT))
        mpPhysicsComponent->addForce(Vector2(20.0f, 0.0f));

    if (mMoveState.isSet(MOVE_JUMP))
        mpPhysicsComponent->addForce(Vector2(0.0f, -200.0f));

    mMoveState.clearAll();
    mpPhysicsComponent->update();
}
{% endhighlight %}

In the class header, immediately after declaring the flag variable, I enumerate what the actual flags are. While I'm usually a big fan of enum class as opposed to a plain old enum, the reason I like them is the reason they don't work here: they're typesafe. In other words, you would need to do a static_cast every single time you wanted to actually use the flag. So instead of that, I use a regular enum and make it private to the class to avoid adding lots of junk to the global namespace. Another approach would be to actually use a namespace.

An important thing to note is that the values of the enums are multiples of 2; 1, 2, 4, 8, etc.. The number of flags you can use is given in the type of variable you use. A Flag8 can manage 8 flags (multiples of 2 up to 128 inclusive), a Flag16 can use 16 (multiples of 2 up to 32,768 inclusive). The progression is much easier to remember if you use hex values instead of decimal values (i.e., 0x2, 0x4, 0x8, 0x10, 0x20, 0x40, 0x80, 0x100, 0x200, 0x400, 0x800, 0x1000, and so on).

In the Cpp file code, you can see the benefit to using a class to encapsulate this behavior rather than bare bitwise operations. It is much easier to understand "mMoveState.set(MOVE_LEFT)" than "mMoveState  &#124;= MOVE_LEFT" if you are not familiar with these types of operators. Then, in update, we can easily check if each flag is set, respond appropriately, and--in this case--clear all of them. This doesn't necessarily need to be the case, that's just for this particular usage.

I welcome you to use my flag class in your own work if you'd like. I would link to the full code here, but it's already all there up above. Just stick the Flag classes in a .h file and be on your way!
