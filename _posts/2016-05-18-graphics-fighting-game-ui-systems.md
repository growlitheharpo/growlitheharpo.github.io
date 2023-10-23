---
title: Graphics Fighting Game and UI Systems
layout: blogpost
author: Allie Keats
selectedurl: Blog
tags: programming college ui
---

The semester is wrapping up, and so I've been writing postmortems for pretty much every project I've been working on. I'm getting ready to update my portfolio with some of the projects I've worked on this past year; I'm a little tired of my website making it look like all I've worked in is Flash. One of my favorite pieces I worked on during the last piece of this semester was my UI system for my Game Architecture final, which is written in C++ using SFML.

<!--more-->

#### UI System Needs

Strictly speaking, our needs for the UI system were relatively minimal. We needed panels*, text, and a few buttons. This is nothing particularly complicated, and we could've made classes for this that were simple and inflexible, especially since this was our last project and we "wouldn't be touching the code again" (more on that to come). Still, I wanted the experience of making a flexible, intuitive system. My teammate on this project said it was "actually beautiful" and one of the best systems he's seen, so I think I achieved that at least. Here's what I wanted overall:

* A manager class that was the sole object responsible for constructing and destroying UI elements
* At the very minimum, classes for text, panels, and buttons.
* A virtual base UIElement class that the others inherit from, allowing for common functions (enable, disable, draw) to be inherited.
* A simple public interface that would allow anyone to pick up the system easily.
* The ability to set the "depth" of an element, and have all elements at the same depth draw at the same time.

*(I should note that I work in Unity a lot at Champlain and so I tend to use their terminology when talking about UI elements.)

#### Results

At the end of this project, I had the following classes hooked up into my UI system:

* UIElement (virtual base)
* UIManager

* UIPanelElement
* UITextElement

* UIPercentageBarElement

* UIButtonElement

The UIPercentageBarElement was used for player health bars as this was, after all, a fighting game. It simply inherited from Panel and added a bunch of extra functions for easy scaling.

UIElement was the base virtual class that all other elements inherited from. It contained a unique ID for each element (currently stored as a std::string for convenience when getting specific elements to manipulate, but given more time I would've stored it as an integer and implemented some sort of hash function for less storage overhead but equally simple lookup ability). The base class was also intended to handle the guaranteed interface for every UI object:

{% highlight cpp %}
    public:
        virtual ~UIElement() { }
        element_id_t getID() const { return mID; }

        void enable() { mEnabled = true; }
        void disable() { mEnabled = false; }
        void toggle() { mEnabled = !mEnabled; }
        bool isEnabled() const { return mEnabled; }

        void setParent(UIElement* newParent) { mParent = newParent; }

        virtual void update(double) = 0;
        virtual void draw(GraphicsSystem*) = 0;
{% endhighlight %}

This is all well and good, but you might notice that the constructor for this isn't in the public members. A first assumption might be that this was just an extra reminder to myself that this class was purely virtual and couldn't be constructed on its own, and the constructor was kept protected for the children. In fact, all of my element classes have either private or protected constructors. They all, however, have a line in common:

{% highlight cpp %}
friend class UIManager;
{% endhighlight %}

#### UIManager, or: How I Learned to Stop Worrying and Love Templates

{% highlight cpp %}
class UIManager : public Trackable
{
    private:
        typedef std::pair<int, std::vector<UIElement*>> depth_list_pair_t;
        std::deque<depth_list_pair_t> mElements;
 
    public:
        UIManager();
        ~UIManager();

        //Three functions for constructing an element; with just an ID, with an ID and parentID, with an ID and parent pointer
        //All three have an optional "depth" parameter used to control draw-order.
        template <typename T>
        T* constructElement(const UIElement::element_id_t& newId, int depth = 0);

        template <typename T>
        T* constructElement(const UIElement::element_id_t& newId, const UIElement::element_id_t& parentId, int depth = 0);

        template <typename T>
        T* constructElement(const UIElement::element_id_t& newId, UIElement* parentElement, int depth = 0);

        template <typename T>
        T* getElement(const UIElement::element_id_t& elementId);

        UIElement* getElement(const UIElement::element_id_t& elementId);

        void clear();
        void update(double deltaT);
        void draw(GraphicsSystem* gSystem);
};
{% endhighlight %}

This is, at its core, all the UIManager is: a std::deque that contains pairs of integers, and vectors of elements. It sounds a little heavy-handed, but in the (admittedly somewhat limited) profiling that I did, it turned out to be the fastest solution. If you're not familiar with a std::deque, here's my brief (and hopefully correct from my research) explanation:

A std::deque is a *d*ouble-*e*nded *que*ue, but that name is a little misleading. To paraphrase [the more technical cplusplus.com explanation](http://www.cplusplus.com/reference/deque/deque/), a deque is similar to a std::vector but allows constant insertion time at the front as well as the rear. It also offers constant time direct access to any elements. Unlike a vector, however, a deque is not stored completely continuously in memory. It maintains smaller "chunks" of continuous memory that link to each other, almost making a hybrid between a std::vector and std::list.

The deque here contains a std::pair of an integer and a vector of elements. I chose this data structure because I found that it was the fastest when profiling and was also conceptually easy to understand and keep sorted, but I am open to suggestions about other types. The important thing to keep in mind here is that the most common operation performed on this collection, draw(), runs quickly and none of the code is too complicated to understand. Let's look at an example: 

*(**EDIT 5/23/16:** Since writing the above description, I did some additional testing using a std::multimap and found that in some, but not all, of the tested scenarios, it performs faster. I am leaving the above description and related code because I think it's important to document my original thought process and solution, and because my choice was valid based on the data I had at the time. That said, know that the projects I am making based off of this code now use a std::multimap instead.)*

{% highlight cpp %}
UIPanelElement* mainMenuPanel =
mUIManager.constructElement<UIPanelElement>("mainmenu_p ", 100);

UIButtonElement* startGameButton =
mUIManager.constructElement<UIButtonElement>("startgame_b", mainMenuPanel, 110);
{% endhighlight %}

This constructs two elements: a panel for the main menu, and a button that goes on that menu. When any variant of the construct element is called, the UIManager will go through the following steps:

1. If in debug mode, give a warning if trying to construct an element with an ID that already exists and return.
2. Actually construct the new element.
3. Cast type T to a UIElement* (and trust that our caller didn't do something really stupid).
4. Compare our depth to the other elements in the list. If the list of elements is empty or if the new depth is less than the first element, insert at the front (using deque::push_front()).
5. Otherwise, check if we can go at the end by comparing our depth to the final element. If it's greater, insert at the end (deque::push_back()).
6. If our depth isn't in the front or back, it's guaranteed to be somewhere in the middle. In that case, the following loop is used:

{% highlight cpp %}
else //we know for sure it goes somewhere in the middle.
{
    element_iter_t iterLead = mElements.begin(), iterFollow = mElements.begin();
    do //loop through each depth we currently have.
    {
        if (iterLead->first == depth)
        {
            //found a pair with the depth we want.
            iterLead->second.push_back(theElement);
            break;
        }

        ++iterLead;

        if (iterFollow->first < depth && iterLead->first > depth)
        {
            //we're currently in-between an element less than our depth and greater
            //so this is where we want to insert
            mElements.insert(iterLead, depth_list_pair_t(depth, { theElement }));
            break;
        }

        ++iterFollow;
    } while (true);
}
{% endhighlight %}

This loops through the collection stored in the deque. If it finds an element that has the depth we want, it inserts the new element into the end of that depth's list of elements. Otherwise, if it determines we're a new depth that hasn't been created before, it will create a new pair in the deque for that depth.

This might seem clunky, but it was better than the other methods I tried which involved either a lot of sorting or a lot of middle-insertion which meant a lot of shifting. And there's this important benefit:

{% highlight cpp %}
void UIManager::draw(GraphicsSystem* gSystem)
{
    for (auto thisPair : mElements)
    {
        for (auto thisElement : thisPair.second)
        {
            thisElement->draw(gSystem);
        }
    }
}
{% endhighlight %}

This is all that's needed for drawing. A simple double-nested for loop. It will always draw every element at the correct relative depth without any extra comparison (other than an `if (mEnabled))` needed.

#### Okay, I admit that constructElement<type> was pretty, but...

...but what about initialization? I'm glad you asked.

Initializing each element was a difficult design decision for this system. Each subclass needed different data to initialize itself and by the very nature of this design, I couldn't use the constructor directly. In the end, I decided to use a somewhat standardized API to handle initialization:

{% highlight cpp %}
void UIPanelElement::init(float x, float y, float w, float h,
                     const Color& color);

void UITextElement::init(float x, float y,
                     const std::string& fontPath, int size,
                     const Color& newColor, utils::HorizAlignment align);

void UIButtonElement::init(float x, float y, float w, float h,
                     const std::string& font, int size, const std::string& text);
{% endhighlight %}

It is somewhat of a pain to have to explicitly call an init function after constructing every element, but it forces you to consider what you need for a given element, and remember to potentially call other necessary setters that aren't included in the constructor or init functions.

In terms of standardization, I used the following ruleset when creating the init functions:

* First, any spatial variables (x and y foremost, then width and height if applicable).
* Second, information absolutely necessary for the class to even make sense. For a text element, that means the font and its size; the same for a button, since it contains text.
* Third, optional information with default values (not included above). This was usually aesthetic information, such as the color of the element or what the starting string should be for a text element.

Using these rules, I designed a system that was, in my and my partner's opinion, easy to use and understand and was flexible enough to handle a lot of different situations. I am planning to reuse this system, or at least something very similar, going forward. My gut feeling is still that having vectors inside of a deque is a heavy-handed and, in the end, poorly optimized solution that only worked well for the low n's I was using, and I would like to find a better, long-term solution. Besides that, though, there is very little I would change about this system and I am very happy with the end result.
