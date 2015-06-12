# Introduction #

This document describes a new architecture of TabJuggler.


# Main Concept #

TabJuggler is a actually a _filter_. It takes a set of elements and operates on them creating an other set.

The actual dataset is made of three kind of objects: browser instances, windows, tabs. The relation between them suggest a forest of trees with three maximum levels:

![http://chart.googleapis.com/chart?cht=gv&chl=graph{Instance_1--Window_1--Tab_1;Window_1--Tab_2;Instance_1--Window_2--Tab_3;Instance_2--Window_3--Tab_4}&hack=browser_ui_objects_graph.png](http://chart.googleapis.com/chart?cht=gv&chl=graph{Instance_1--Window_1--Tab_1;Window_1--Tab_2;Instance_1--Window_2--Tab_3;Instance_2--Window_3--Tab_4}&hack=browser_ui_objects_graph.png)

Each node can have special properties. For example an _instance_ can be normal or incognito. Or a tab can be the current selected one. Some properties are projected on the vertical axis. For example a tab market selected makes selected all the nodes between it and the instance.

TabJuggler _operates_ on the previous data structure by changing the parent of nodes. The current version can move tabs and spawn new windows but future releases can also spawn new instances (for example: make all tabs in incognito mode)

The minimum structure operators are the following:

| **Name**      | **Input Arguments** | **Output arguments** |
|:--------------|:--------------------|:---------------------|
| reparentTab   | aTab:Tab,targetWindow:Window | reparentedTab:Tab    |
| sortTabs      | aWindow:Window,toSortTabs:Tab[.md](.md),orderFunction:function(a:Tab,b:Tab) | sortedTabs:Tab[.md](.md) |
| spawnWindow   | aInstance:Instance  | newWindow:Window     |

Operators can be chained to have more complex behaviours.

Since not all nodes have the same properties TabJuggler is supposed to work on selected sets of nodes. This introduces the concept of _selectors_ which are responsible to filter-out sets of nodes. Obviously is possible to define only one generic selector:

| **Name**      | **Input Arguments** | **Output arguments** |
|:--------------|:--------------------|:---------------------|
| selectTabs    | tabs:Tab[.md](.md),selectFunction:function(a:Tab) | selectedTabs:Tab[.md](.md) |

}}}```