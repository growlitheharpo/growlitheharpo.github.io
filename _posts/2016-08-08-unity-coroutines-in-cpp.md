---
title: Unity-esque Coroutines in C++
layout: blogpost
author: James Keats
selectedurl: Blog
tags: programming college game-architecture unity
---
This is a blog post I've been meaning to write for quite some time. My summer engine project is winding down and, due to a lack of time, never quite reached the level I wanted it to. Still, one of the best aspects of what I was able to complete was the Coroutine system. This doesn't use proper concurrency to run (although I will talk a bit more about that in a future post), but somewhat emulates the way a lot of really common coroutines work.

<!--more-->

#### Needs: Common Use Cases

When working in Unity for class projects, I find myself writing certain coroutines over and over again. There are, essentially, two main types that I practically have generic C# versions for:

1. The "WaitForSeconds" Function
This is usually a glorified "Invoke()" call that I used a coroutine for because I think it looks cleaner and I don't personally like to use a hardcoded string function name. This is usually just a coroutine that will "yield return new WaitForSeconds(x)" at the top, followed by a regular function that needs to happen after a delay.

2. The "EndOfFrame" Lerp
The second most common coroutine I write and see is one that lerps a value over a certain amount of time. This has been everything from a color to position, to some simple float value. Often the caller needs some sort of status tracker or callback for the lerp so it can take an action once it has completed, but the basic point is a value needs to change over a series of frames.

#### Other Needs: Simplicity & Ease-of-Use

One of the great things about coroutines in Unity is that once you get the basic idea of them, they are very flexible and easy to use. Whenever you need something to happen over time or at a separate time, it's super easy to declare a coroutine and make that happen. Simplicity is a key aspect of this system--if you have to declare a new class every single time you want a new coroutine, or if you have to type more than a few lines, it's not a successful system.

In the end, my implementation hit all of these needs with only a few caveats. Let's dive in...

#### The Solution

Let's start by looking at how you would use the coroutine system.

{% highlight cpp %}
void SomeClass::startSomething()
{
    //shrink our size
    const float time = 2.0f;
 
    CoroutineManager::startCoroutine(
        new LerpValOverSeconds<float>(&mScale, 0.1f, time));

    CoroutineManager::startCoroutine(
        new PrintAfterSeconds("Done shrinking!", time));

    mPrintRoutineToStop = CoroutineManager::startCoroutine(
        new PrintAfterSeconds("Never print this...", time * 2.0f));

    CoroutineManager::startCoroutine(
        new CallMemFuncAfterSeconds<SomeClass>(time, &SomeClass::finishSomething, this));
}

void SomeClass::finishSomething()
{
    //mPrintRoutineToStop will be nullptr after this call, and will no longer happen.
    if (CoroutineManager::isRunning(mPrintRoutineToStop))
    {
        CoroutineManager::stopCoroutine(mPrintRoutineToStop);
    }
}
{% endhighlight %}

There's a lot going on here. Let's break it down line-by-line.

* Start a "LerpValOverSeconds" routine.

This is a coroutine that does exactly what it sounds like. You pass in a pointer to a value, the end value, and a time you want it to take place over. This is a template class. T must have the following operators overloaded: assignment, addition, multiplication, and the less-than (<) comparison operator. These requirements come from the underlying generic "template <typename T> math::lerp()" function that the coroutine uses. Over the next 2 seconds worth of frames, the value of "mScale" will be lerped to 0.1 automatically by the coroutine manager.

* Start a "PrintAfterSeconds" routine.

There are two of these here. The first prints "Done shrinking" after two seconds. The second is there to demonstrate another feature of the coroutine system: the ability to stop coroutines while they are running. A call to startCoroutine() simply returns the same pointer that was passed into it as an argument, avoiding a clunky situation where you declare the coroutine on one line just to start it the next. We start a function that is supposed to print in four seconds instead of two, and then...

* Start a "CallMemFuncAfterSeconds" routine.

This is probably the most powerful coroutine out of the bunch (and one that has the potential to be dangerous). Again, it's all in the name; this coroutine calls a member function after a given amount of time. The danger here is if this is deleted before the coroutine completes. Bad things happen in that scenario, because the coroutine has no way of knowing. Thus, though I didn't do it here to simplify the code example, it's important to maintain a list of coroutines that are currently running on any given object and stop them in the destructor. This also applies to the LerpValOverSeconds routine if the value being lerped is a member variable. This adds a bit to code complexity, and I'm still deciding if I want to make a MonoBehaviour-esque base class that will handle all of this itself. 

* Stop a coroutine

This is the final thing done in the code snippet above. "finishSomething()" is called after two seconds by the coroutine. It then checks to make sure that mPrintRoutineToStop is still running, and if it is, it stops it. Both of these functions take a pointer by reference. "isRunning()" will set the pointer to nullptr if the coroutine is no longer running, and "stopCoroutine()" will do the same when it stops it.

#### Under the Hood

As you can tell, there's a bunch of child classes involved to give this level of functionality, but the coroutine system at its core is only a few classes: CoroutineManager, BaseCoroutine, and WaitType.

WaitType is how we keep track of when a coroutine needs to execute. There are three types that the system understands: WaitForNextFrame, WaitForSeconds, and CoroutineCompleted. The last of these is obviously not a "wait" type in the strictest sense, but is how the system knows to cleanup a coroutine. 

BaseCoroutine is a very simple interface class. It provides one pure function: WaitType* BaseCoroutine::run(). "run()" is called by the CoroutineManager when it's time for the coroutine to execute its main code, which varies for each type of coroutine.

The CoroutineManager is where the interesting stuff happens. It maintains two lists of coroutines: the first is the list that have timing data and are still counting down, stored in a `std::vector<std::pair<float, BaseCoroutine*>>`. Every frame, we decrement Time::deltaT() from each pair's float, and if it's less than or equal to zero, we add it to the other list: a `std::vector<BaseCoroutine*>` that holds everything that needs to be executed this frame. We then iterate through each coroutine in that list, and call its "run()" function to execute something. What this entails is different for each type of coroutine.

This means a lot of insertion and deletion into vectors which sounds scary at first, but the nice thing about it is that the execution order doesn't strictly matter; the only important thing is that we don't execute the same coroutine twice in one frame which is easy enough to avoid. Therefore, I exclusively use push_back() instead of insert() to add items to these lists which saves on insertion time, and I use "swap and pop" to remove items. If you haven't heard of this, it basically means swapping your item to be deleted with the last item in the vector, and then calling pop_back() to remove only the last element. This avoids the complexity of erasing an item in the middle of the vector, leading to every subsequent element having to shift over.  Here's the entirety of the CoroutineManager::update() function:

{% highlight cpp %}
void CoroutineManager::update()
{
    //First, loop through all the waiting routines and subtract the deltaT.
    for (size_t i = 0; i < mWaitingRoutines.size(); ++i)
    {
        mWaitingRoutines[i].first -= Time::deltaTf();

        //If all time has elapsed, add it to the list to be processed this frame
        if (mWaitingRoutines[i].first <= 0.0f)
        {
            mNextFrameCoroutines.push_back(mWaitingRoutines[i].second);
            utils::unordered_erase(mWaitingRoutines, i);
            --i;
        }
    }


    BaseCoroutine* thisRoutine;
    WaitType* wait;

    for (size_t i = 0; i < mNextFrameCoroutines.size(); ++i)
    {
        thisRoutine = mNextFrameCoroutines[i];
        wait = thisRoutine->run();

        if (wait->getType() == WaitType::T::FINISHED)
        {
            //mNextFrameCoroutines.erase(mNextFrameCoroutines.begin() + i);
            utils::unordered_erase(mNextFrameCoroutines, i);
            i--;

            safe_delete(thisRoutine);
        }
        else if (wait->getType() == WaitType::T::FOR_SECONDS)
        {
            mWaitingRoutines.push_back(pair_t(static_cast<WaitForSeconds*>(wait)->getTime(), thisRoutine));

            utils::unordered_erase(mNextFrameCoroutines, i);
            i--;
        }

        delete wait;
    }
}
{% endhighlight %}

Internally, coroutines have to manage different types of data such as their own progress, whether or not they need to repeat, plus any data necessary to complete the actual task they solve. Overall, this isn't quite at the level of flexibility and ease-of-use that the Unity coroutine system has, but it's getting somewhere close, and I'm excited to keep working on it.

As always, reach out to me here or on social media if you have any questions. This is the kind of stuff I love to talk about.
