---
title: Unity's SmartMerge Meets SourceTree
layout: blogpost
author: James Keats
selectedurl: Blog
tags: programming college unity
---
Before I begin, I want to give credit to whoever wrote the blog post that used to be located at the following link: [http://www.nikumangames.com/dev-blog/unity-and-sourcetree-and-unityyamlmerge-exe-oh-my/](http://www.nikumangames.com/dev-blog/unity-and-sourcetree-and-unityyamlmerge-exe-oh-my/)

The only reason I'm writing this post is that it looks like their website is down and isn't available in the Wayback Machine. So thank you, mysterious vanishing developer(s)! Major credit also goes to Tim Pettersen ([@kannonboy](https://twitter.com/kannonboy)) for his GDC 2017 talk on incorporating Unity with git which is what got me started down this path.

<!--more-->

This guide is aimed at developers on Windows. The setup process for OSX will be similar but some of the specifics about things like file paths will be different.

The basic point of this post is as follows: git is an incredible piece of version control. I think it blows the rest out of the water. If you haven't, you should check out Tim Pettersen's full [guide to setting up git with Unity](http://www.gamasutra.com/blogs/TimPettersen/20161206/286981/The_complete_guide_to_Unity__Git.php). SourceTree is also a great piece of software that makes git more accessible to a lot more people. Unfortunately, getting all of the great version control tools with Unity and git to work well with SourceTree isn't totally clear-cut. The following is a guide on setting up SmartMerge with SourceTree, and assumes you've already followed the guide that Tim provided (although you can skip the steps about handling large Unity assets if you're not working with a server that supports it; for all my Champlain friends, unfortunately Pineapple does not have git lfs support yet).

#### Setting Up SmartMerge in SourceTree

Unity has a guide for setting up their YAML Merge tool with SourceTree available [on their website](https://docs.unity3d.com/Manual/SmartMerge.html), but here's what they say to do:

1. Go to Tools -> Options -> Diff
2. Under the "External Diff / Merge" heading, change Merge Tool to Custom.
3. In the **Merge Command** field, type the full path to the UnityYAMLMerge executable.<br>(On Windows,this will generally be *C:/Program Files/Unity/Editor/Data/Tools/UnityYAMLMerge.exe*)
4. In the **Arguments** field, type: *merge -p $BASE $REMOTE $LOCAL $MERGED*

#### Setting Up UnityYAMLMerge

SmartMerge needs a merge tool to fall back on. You should probably use a visual merge tool such as P4Merge from Perforce. You can <a href="https://www.perforce.com/downloads/visual-merge-tool" rel="nofollow" target="_blank">download that here</a>. Note that you don't actually need to register to download, and that when installing you can deselect everything except P4Merge.

1. Find the following file: *[Unity Install Directory]/Editor/Data/Tools/mergespecfile.txt*
2. Within this file, locate the two lines starting with "unity use" and "prefab use".
3. If you used P4Merge and installed to the default location, change them to this **exactly**:<br>
    *unity use "%programs%\Perforce\p4merge" "%b" "%r" "%l" "%d"* <br>
    *prefab use "%programs%\Perforce\p4merge" "%b" "%r" "%l" "%d"*

If you're using something other than P4Merge, you will need to determine the correct path and order of the command line arguments. Note that these lines *should* be the same on OSX but I've only tested on Windows.

#### Other Tips

In his [Gamasutra post](http://www.gamasutra.com/blogs/TimPettersen/20161206/286981/The_complete_guide_to_Unity__Git.php) that summarizes his GDC talk, Tim Pettersen also recommends turning off "keepBackup" for your merge tool, which will help keep your working directory clean. The easiest way that I've found to do this in SourceTree is to open the Terminal and enter the following: *git config --global mergetool.keepBackup false*

If you've done everything right, the next time you have a merge conflict with Unity scenes or prefabs, you should be able to right click on the file in <b>File Status</b> in SourceTree, go to Resolve Conflicts, and then Launch External Merge Tool. If the conflict is a relatively simple one, SmartMerge will be able to determine the correct course of action and merge the data. If both versions have edits to the same data, it will launch P4Merge (or whatever your external merge tool of choice is) which will then require you to manually choose which version of the component you want to keep.

Hopefully you found this guide helpful. Have fun with Unity and git!
