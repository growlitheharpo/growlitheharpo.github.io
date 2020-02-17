---
title: James Keats - re[Mod] (Senior Capstone Champlain College)
byline: "Full-Year Project by The Firing Squad"
layout: portfoliomd
selectedurl: Portfolio

meta:
    title: "re[Mod]"
    language: "C# (Unity)"
    year: "2017 - 2018"
    platform: PC
    img: /assets/img/portfolio/remod/s2_cover1.jpg

    teamname: "Team: The Firing Squad"
    team:
        - "Tyler Bolster // Lead Artist & Animator"
        - "Charlie Carucci // Lead Designer & Product Owner"
        - "James Keats // Lead Programmer & Build Master"
        - "Max Sanel // Project Manager & Scrum Master"
    auxteamname: "Recruits: Joined Jan 2018"
    auxteam:
        - "Tim Eccleston // Level Designer"
        - "Natalie Frost // VFX Designer"
        - "Michael Manfredi // Environment Artist"
        - "Justin Mulkin // Gameplay & Analytics Programmer"
        - "Jake Buzzell & Max Johnson // Music Composer"
---

#### re[Mod] is [available on itch.io](https://thefiringsquad.itch.io/remod)!

re[Mod] is an all-new first-person arena shooter that centers around a dynamic weapon building system. Players collect a diverse set of weapon parts strategically placed around the arena, modifying their weapon on-the-fly to destroy their opponents. Working with their team, players can capture stage areas to be awarded devastating LEGENDARY weapon parts. With over 1,000 possible combinations, players can explore and create their own unique weapons and dominate the battlefield.

<p>
{% include util/vimeoplayer.html url=269262863 loop=0 %}
</p>

For students in the game-related majors at Champlain, the first semester of the senior year  is spent on a single project with a small team in a pre-production environment, followed by a second semester of full production if the game is selected by the faculty. You can take a more in-depth look at the development history of this project on my blog. This is the result of that process.

![](/assets/img/portfolio/remod/s2_cover2.jpg){: .center-image }

![](/assets/img/portfolio/remod/s2_cover3.jpg){: .center-image }

In total, re[Mod] is the result of just under 2000 hours of work by this 4- (and later 8-) person team. As the only initial programmer on the team, and then the lead programmer, I had a lot of responsibilities. Here's what I can remember doing:

* Implementing the core gameplay mechanics and systems during pre-production, including:
    * Networking of the entire game through Unity's UNET HLAPI.
    * Dynamic, on-the-fly weapon building.
    * Weapon parts with specific effects and architecture to support this.
    * First-person-shooter gunplay and movement.
    * Artificial intelligence (cut from the game after a change in direction).
    * Audio integration with FMOD.
    * UI design and integration based on mockups.
* Code architecture and documentation
    * Implementing the Service Locator pattern and Event Queue/Observer pattern.
    * Reducing coupling through the use of interfaces.
    * Fully documenting all code using C#-standard XML format.
    * Creating an 11-page technical plan with the goal of laying out the plan for the project in the early stages, and helping to onboard the new team members, as well as justifying technical choices.
* Developing a design and art pipeline compatible with rapid iteration
    * Creating several Unity Editor tools to assist the designers.
    * Ensuring that classes without explicit tools used annotations like [Tooltip], [Range], [Header], and more to make editing easier for the designers.
    * Authoring several tweaked versions of Unity's standard shader to the artists' specifications.
    * Creating a post-asset import tool that automatically filled all texture maps in materials using that shader as a quality-of-life improvement.
* Developing a repository flow using git and a standardized build system for archival purposes
    * Creating a branch naming and commit message convention followed by the team.
    * Creating a tagging and auto-build system for QA and for weekly builds.
    * Creating a Slackbot for notifying the team when a new build was created.
    * Creating a pre-commit git hook installable through the Unity Editor that enforces things like naming conventions and ensuring new assets have linked meta files.

#### Original Pre-Production Trailer (November 2017)
<p>
{% include util/vimeoplayer.html url=243548187 loop=0 %}
</p>
