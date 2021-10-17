---
title: Diablo II&#58; Resurrected - Render Graph
layout: blogpost
author: James Keats
selectedurl: Blog
tags: programming graphics diablo2
---

One of the most interesting systems I had the opportunity to work on for Diablo II: Resurrected was the HD render graph. I was its owner from conception to final implementation. It involved graphics programming, mulithreading, resource management, and more - plenty of scary topics all wrapped up in one package.

<!--more-->

### Table of Contents
{: .no_toc}

* TOC
{:toc}

# The Problem

There were ultimately  many problems that this system addressed, but the origin was purely a matter of CPU utilization. Diablo II: Resurrected (D2R from here on out) did not have a dedicated render thread, but had a lot of CPU work that needed to be done for rendering (more on what specifically that entailed later). Luckily, we did have a "dumb" job/thread pool system available. Our first attempts at parallel execution of render work was very hard-coded. We attempted to group work together that we knew could execute at the same time, trying to balance it so that things kicked together took roughly the same amount of time. Unfortunately, many of our tasks were quite variable depending on the current gameplay scenario, which meant our utilization often ended up looking like this:

![](/assets/img/blog/render-graph/old-tasks.svg){: .center-image }

Obviously, there is a lot of time wasted here. Tasks D and E could've started much earlier, instead of waiting for C which they do not depend on. But on another frame, the situation might be reversed (e.g. Task B takes longer than C), and so if we went in and manually re-ordered things to fix the first scenario we would make performance worse in the second. Thus it became clear we needed a system that could handle this variation at runtime and schedule work accordingly. In order to do this safely, it would need to understand dependencies. It would also need to ensure access to shared resources was managed safely, or else we'd need to sprinkle mutexes across the entire rendering codebase and probably kill our parallelization goals in the process. Over time, it became clear that a system which did all of this could handle even more parts of the rendering process.

# Overview

At a high level, the render graph for D2R is an orchestration system that handles:
* Scheduling CPU-side rendering tasks
* Submitting GPU-side rendering work recorded by those tasks to the command queue(s)
* Ensuring safe resource access

Tasks were declared as a series of declarations/descriptions, e.g.
{% highlight cpp %}
RenderTask::Desc task1("Task 1"_hash);
task1
    .Requires(RenderGraph::RenderCommandList)
    .Requires(RenderGraph::UploadStream);
    .Action([](RenderTask::Context& ctx) {
        // Code goes here
    });

renderGraph.AddTask(std::move(task1));

// Add more tasks here...

renderGraph.Compile();
{% endhighlight %}

For our purposes, CPU-side work means any work done on the CPU that contributes to rendering. As mentioned above, D2R did not have a dedicated render thread, instead using the render graph and the task-based model it imposed to handle rendering. On the CPU, tasks did things like:
* Uploading "setup" data and constants, e.g. allocating and populating a "Frame Constants" buffer with the camera matrix, delta time, etc.
* Iterating over data from game systems to build compact draw call lists for other tasks to consume
* Iterating over those draw call lists and submitting draw calls to a command list for a forward pass, a transparent pass, etc
* Preparing and issuing (async) compute work, or reading back compute work

The definition of what constituted CPU-side work for the render graph was a bit nebulous. Anything that "contributed to rendering" could be added to a task and orchestrated by the graph, but arguably *everything* in the game "contributes" to rendering in some way or another. Indeed, as the system matured, more and more was completely or partially managed by the graph, including even particle system simulation. More on why that later.

Defining GPU-side work is obviously a bit easier. Some of the render tasks would record rendering or compute GPU work to command lists which the graph would submit to the command queue(s).

# Resource Management

"Ensuring safe resource access" is also a bit nebulous and refers to both CPU-side and GPU-side synchronization. The graph understood many types of resources, including constant buffers, draw call lists, etc. The graph also managed `Surface`s (i.e. render targets), but those were handled a bit differently. For most resource types:
* Resources managed by the graph had three verbs: `Create`, `Utilize`, `Destroy`
  * Only one task per frame could create a resource
  * Many tasks could utilize a resource but only had `const` access to it
  * Only one task per frame could destroy a resource
* The graph would guarantee that the Creator would execute before any Utilizers, and all the Utilizers would run before the Destroyer, but many Utilizers could run in parallel

This, plus proper `release`/`acquire` semantics enforced on the shared data *within* the graph when tasks began and completed, meant that programmers writing the code for the tasks themselves did not need to worry about mutexes or atomics or other synchronization. As long as resources were declared correctly and lived inside the graph, it would be handled for them. The system had several tools for ensuring that this happened:
* When tasks descriptions were written, they were required to declare all resources they wanted access to, e.g.
{% highlight cpp %}
taskDesc1
    .ReadsDrawCallList("Example Draw Calls"_hash)
    .PopulatesConstantBuffer("Example Constant Buffer"_hash)
    .FreesScratchBuffer("Example Scratch Buffer"_hash);
{% endhighlight %}
Note that the specific verbiage used in the declaration functions was chosen to reflect pre-existing concepts about how each specific resource type would be used. For example, we would say a task `Binds` a constant buffer but `Reads` a draw call list, or `Frees` a scratch buffer but `Resets` a draw call list. Despite using different terms, all of these ultimately mapped to the same three core operations (`Create`, `Utilize`, and `Destroy`). In fact, all the graph needed internally to orchestrate resource usage was a flat list of verb and resource string hash for each resource a task involved.

As a quick aside: in hindsight, one of the best decisions for this system was using "strings" (which became just hashes in external builds) for all identifiers in the graph. It made debugging task interactions a breeze, as there was never any guessing about what task was running, or what resource it was trying to access. Of course, unlike in my examples here, in the real codebase these were all declared as shared constants to ensure compilation errors instead of silent typos which is the bane of any system using string identifiers.

* Inside the action code for a task, access to resources was only given through the "context" variable provided to the task by the graph, e.g.:
{% highlight cpp %}
taskDesc1
    .ReadsDrawCallList("Example Draw Calls"_hash)
    .Action([](RenderTask::Context& ctx) {

        // All good here
        const auto& drawCalls = ctx.ReadDrawCallList("Example Draw Calls"_hash);

        // Compilation error - ReadDrawCallList returns const ref so task cannot modify the list
        // auto& drawCalls = ctx.ReadDrawCallList("Example Draw Calls"_hash);

        // Runtime assertion - task declared it would Utilize this resource, not Create it.
        // auto& drawCalls = ctx.PopulateDrawCallList("Example Draw Calls"_hash);

        // Runtime assertion - task did not declare it would use this resource at all!
        // auto& constantBuffer = ctx.BindsConstantBuffer("Example Constant Buffer"_hash);
    })
{% endhighlight %}

Inside the action, the task had to effectively re-declare its intention for accessing the resource when it fetched the resource. The graph would assert if a task ever tried to access a resource using the wrong verb or access a resource it did not declare its intention to use.

One fanciful dream I had was eliminating the need for declaring resource usage as part of the task description and instead deriving it from the task's action. The idea was that we could execute the graph once in some sort of "dry run" mode, noting what resources each task accessed and using that to build the dependency list. There are a few reasons this didn't work:
* Conditional resource access: a task may not access every resource it needs every frame (e.g. if a draw call list is empty, it may never try to bind a constant buffer)
* Systemic side effects: some tasks had side effects outside of the graph; for example, our terrain system would mark dirty tiles as clean after the task executed, but we wouldn't want this to happen during a "dry run" and we wouldn't want to move this state into the graph as it was entirely internal to one system.

## Render targets

As alluded to earlier, render targets required special consideration by the graph. For the most part, after creation, CPU-side synchronization was unimportant for these. Every task effectively only needs to `Utilize` them. Instead, for this resource type, GPU synchronization is far more important. Our primary concern was ensuring correct ordering and ensuring resource barrier states were correct.

Since there was effectively no CPU-side synchronization required for this, we *could* use a "lazy" system for this, whereby tasks did not need to declare their intentions when added to the graph, but could instead simply use the resource in their action. For example:
{% highlight cpp %}
taskDesc1
    .Requires(RenderGraph::RenderCommandList)
    .Action([](RenderTask::Context& ctx) {
        globalTarget1.Transition(TargetState::CopyDestination, ctx);
        // copy something into it using ctx.commandList
        globalTarget.Transition(TargetState::CopySource, ctx);
        // copy something out of it using ctx.commandList
    })

taskDesc2
    .Requires(RenderGraph::RenderCommandList)
    .Action([](RenderTask::Context& ctx) {
        globalTarget1.Transition(TargetState::Render);
        // render something to it using ctx.commandList
    })
{% endhighlight %}

At runtime, the graph would keep track of a task's `Transition` calls per-target. Every task had a `preState` and `postState` for each surface it used. Inside the `Transition` call, it would update those states and only insert an actual resource barrier if the target had already been accessed in this task (and thus, it knew the "before" state). At submission time, after all CPU-side work had completed and command lists were being submitted to the command queue, the graph would insert barriers into the `preState` at the end of the *previous* task's command list. In this way, the graph didn't need to know the "Before" state of a resource the first time it was accessed in a particular task until after execution finished.

# CPU Orchestration

With all of this background context, it is fairly easy to see how the graph was able to schedule CPU tasks. By knowing all of the shared resources a task would use and which "verb" it had, the graph could push task actions into the thread pool as soon as they were safe to run. There were several optimizations here to avoid having to re-analyze all of this information every frame during execution; most of the analysis took place in the (runtime) `RenderGraph::Compile` function which was called after all tasks were added. In addition to pre-caching dependency information, this function would detect circular dependencies and assert should any be introduced. Without getting too into the weeds, at a high level the graph almost exclusively used bitmasks to track completion states and required states and most of the runtime work was actually just a handful of `AND`s and `OR`s. Using bitmasks for tracking limited us to 32 tasks (with room to easily grow to 64), but in actuality our final task count was in the high teens so this was a non-issue.

Over time, we found that graph-managed resources alone were not enough to handle all the dependencies we needed. For example, some, but not all, of our tasks required the frame's particle system simulation to finish. It would have been a waste to wait until this finished to start the graph, but the simulation obviously didn't need any of the resource types managed by the graph, and we didn't really want to make it a task. This need resulted in us eventually introducing the concept of CPU-side fences. `RenderGraph::Fence` was a very simple type which simply had a `Signal` method and a `Reset` method. In its description, a task could declare that it `WaitsForFence("Fence 1"_hash)`. Meanwhile, any system in the codebase (even those executing totally outside the graph) could fetch the fence using its ID and `Signal` it at any point, before or during graph execution. The graph would take this into account when determining which tasks were ready to run.

# GPU Orchestration


