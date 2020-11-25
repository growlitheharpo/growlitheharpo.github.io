---
title: Capstone - Semester 1 Postmortem
layout: blogpost
author: James Keats
selectedurl: Blog
tags: programming college capstone
---
My portfolio post about re[Mod] is [available to look over now](/portfolio/remod.html), and discusses my primary roles for the project. Thanks again to [Max Sanel](https://certifiedscrumming.wordpress.com), [Charlie Carucci](https://charliecarucci.com), and [Tyler Bolster](https://www.artstation.com/tybolster)--the other members of the team--for making all of this possible.

The fall semester is coming to a close, and we're all completing our closing kits, tying up loose ends, and prepping to move forward into next semester. The good news is that re[Mod] was one of the projects selected by the faculty to move forward into full production in the spring semester. That was an incredible bit of validation for the entire team, and we're all excited to get started with our new team members. First, though, we all need to reflect on the successes and failures of the project, and the things we learned.

<!--more-->

#### What Went Well?

We made a good game. Consistently, our peers at QA validated our belief in our core mechanic and came back again and again to play the game. Players within our target audience of individuals who play first person shooters would come back even after QA was over to play more rounds of the game. One of our professors, Dan Buckstein, told us that out of all the projects, our game gave him the biggest adrenaline rush while playing against other faculty members.

From a repository manager and build master perspective, the flow and the bookkeeping for this project were flawless. The team embraced our commit message format (stylized after the [semantic commit](http://karma-runner.github.io/0.10/dev/git-commit-msg.html) rules) and every week, our progress is tagged with an auto-generated changelog and an automatic cloud build stored on a separate build repository provided by the school. The team embraced the use of branches in git, and we ran into very few merge conflicts and no data loss thanks to the good practices observed by the team.

Our team dynamic was excellent. Though there are always little nitpicks and elbow-ribbing jokes about each other, the fact is that all of our personalities meshed together very well. The quality of project we were able to complete is thanks our excellent, constant communication and understanding of each other. Everyone on the project was truly dedicated to it, and it shows.

From a programming perspective, writing code for this project was fun and (for the most part) relatively easy. The nature of our game meant there weren't too many huge hurdles to overcome, and most of the difficulty emerged from the networking. In the final vertical slice, the networking is fast and uses very little bandwidth. While there is, of course, always more that can be done, we were able to achieve the performance we were looking for without needing to reach to an outside library. Next semester, we will definitely be re-examining this choice. Still, all of the code was well-documented in the C#-standard XML format and onboarding for next semester will be a breeze.

#### What Didn't Go Well, and What Did We Learn?

Frankly, not to play up the team's skills too much or sound unrealistic, there really wasn't a lot this semester that would fall under this category that I attribute to internal causes. There are several issues that a lot of us took with the overall design and flow of the Capstone process and especially with the end of the semester "team selection" process for the individuals who got cut, but in the end all of that is outside of our control and our team got through all of it relatively unscathed.

One issue I will admit to, though, is that the first pass at networking sucked. It was done in a slapdash manner, meant to get the game testable as quickly as humanely possible. Essentially, we went from a single-player split screen game to a networked game in less than 48 hours. I think this was a misplaced priority for me personally, and I want to emphasize that I set myself against that hellish schedule of my own volition and not because of pressure from the team. I thought that the best thing we could do is get a networked QA test as soon as possible to see whether or not players preferred that to the other version right away, so that we could confirm we were headed down the right path. Admittedly, in that process, I did learn an awful lot about Unity's [HLAPI](https://docs.unity3d.com/Manual/UNetUsingHLAPI.html) and LLAPI for networking. But overall, because of bugs and lag in the original "just-get-it-working" implementation, the results we got from QA during the first few networked weeks were significantly less valuable. The experience simply was not what we were going for, and I probably should've spent more time learning, planning, and taking my time before doing a proper implementation from the start.

Another potential issue, I will admit begrudgingly, was possibly our engine choice. Unreal Engine, the primary competitor to Unity, was made for shooters. This is an undeniable fact. By working in Unity, we were starting with nothing and working from the ground up. My concern at the start of the semester was that I don't really know Unreal; even though I'm arguably more proficient in C++ than C#, Blueprints are a whole new world to me and I didn't want to risk messing up the team while I learned to use the engine beyond the 5 or 6 tutorials I've completed. In retrospect, the end product probably would've benefited more from an engine built for its genre. Tyler, our artist, also would've been much happier working in Unreal, and it was something we caustically joked about all semester. That's not to say Unreal would have been a problem-free choice. It would've taken longer to get up-to-speed, and I would still be discovering new things about the engine even now at the end of the semester. I wouldn't have been able to make custom inspectors for Charlie to use, or integrated our git hook installer into the Editor. If we were starting over or I could go back in time, the choice between Unity and Unreal would not be an easy one. But, in retrospect, I should not have dismissed Unreal as quickly as I did.

#### Thoughts Going Forward

Next semester is going to be a whirlwind of development for re[Mod]. Our plans include different gamemodes including potentially King of the Hill, Control/Capture Point, Capture the Flag, and more. We will be adding new mechanics, including bringing back the turrets, adding environmental hazards, and overall increasing the amount of things the players can engage with. We'll be really polishing the feel of the game, adding a lot of the little touches that make modern shooters feel so satisfying to play. And, of course, we'll be adding new weapon parts to expand the choices that players have.

It's going to be an exciting extra three or four months of development, and I'm very thankful that re[Mod] was able to pass through pre-production. Next semester we'll be expanding our team and really giving it our all. I can't wait!

<p>
{% include util/vimeoplayer.html url=243548187 %}
</p>
