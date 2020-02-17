---
title: James Keats - BTV Flight (Burlington International Airport)
byline: "Emergent Media Center - Sandbox Team"
layout: portfoliomd
selectedurl: Portfolio

meta:
    title: "BTV Flight"
    language: "C# (Unity)"
    year: "Summer 2016"
    platform: PC + Kinect
    img: /assets/img/portfolio/btvflight/cover.png

    teamname: Emergent Media Center - Sandbox Team
    team:
        - "James Keats // Programmer"
        - "Tyler Bolster // Prop Artist"
        - "Cait Kenney // Environment & Prop Artist"
---

BTV Flight was a project created for Champlain's Emergent Media Center in partnership with the Champlain College Office of Advancement along with Burlington International Airport. This interactive experience is played with an Xbox Kinect 2.0, and is designed to be approachable and inviting to anyone passing through the airport. It is currently on display in the North concourse of BTV. There were several important and unique aspects that needed to be considered during the development of flight that arose because of its final destination. These included accessibility, and the need to avoid any potential for violence, cartoonish or otherwise.

![](/assets/img/portfolio/btvflight/1-2.png){: .center-image }

### Artificial Intelligence

During the development of BTV Flight, our clients stressed that, above all else, it had to be completely impossible to crash or collide in any way with anything in the environment. There had to be no possible way for players to create any form of "potentially disturbing imagery" while in the airport.

Having never taken an AI class before, I had to do a lot of research to achieve this. I ended up learning about Steering Behaviors, and utilized them to their fullest potential here. The flexibility and simplicity of Steering proved invaluable, as we kept adding more movement behavior to the AI-controlled planes in the environment.

To make this possible, I developed a component-based package system. The Base AI state machine would examine all the potential movement packages available to it and choose the best one based on its current situation. Some of the packages included:
* SeekTarget
* EvadeTarget
* SpecialEffectLoopdeLoop
* SpecialEffectWarpToLightspeed

![](/assets/img/portfolio/btvflight/3.png){: .center-image }

### Gesture Recognition

Gesture recognition was also important for Flight. We to use the Xbox Kinect 2.0 as a way to make the game more accessible. While the initial gestures were easy to nail down (raise your arms to fly, then tilt back and forth like a kid to turn left and right), some of the others were more difficult. For example, you must cross your arms if you want to cycle through the various potential player avatars. The solution for this was to normalize the positions of the joints in the player's arms, then compare their relative positions to see if they were crossed.

Trying to determine when people were done playing was even harder. We had to pick an arbitrary threshold for what counted as having your "arms down" after playing, which the game would then determine based on a combination of angles between the hands and shoulders, as well as the raw x, y, and z values of certain joints. This was important to get right, because we wanted people to be able to queue up and have the game correctly determine when one person was trying to play and when they had stopped so it could look for a new player.

![](/assets/img/portfolio/btvflight/btv_flight_with_vinyl.jpg){: .center-image }

### Looking Forward

One of the important aspects of BTV Flight was that it could potentially be picked up at any point in the future by a team that had no relation to the original development team. One of my supervisors had a dream of a version of the project one day being installed in airports all across the country with localized versions of the AI planes in each. With this in mind, we did everything we could to make things easier for this potential future team.

The first and most important thing was, of course, documentation. We all wrote full documentation files for the project, and I was sure to document all of the code as I wrote it. I also did my best to design the code architecture to be as extensible as possible, so that it would be easier to plug in new items and code later without having to change too much of the core. I also wrote Unity Editor tools (such as the one on the left) to make sure that future designers would be able to change things in the game without needing to write new code.

Overall, BTV Flight was a fun project and a great experience working with a client. Check it out if you ever fly in/out of Burlington, VT.
