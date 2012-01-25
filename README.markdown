propagit
========

Cascading multi-server git deployment.

This project needs a few more features to be actually useful. Coming soon.

example
=======

First start up a hub server to listen for git deploys:

    $ propagit hub --port=6000 --secret=beepboop --repodir=./repos
    control service listening on :6000
    git service listening on :6001

then spin up as many drones as necessary on other machines:

    $ propagit drone --hub=hubhost:6000 --secret=beepboop --repodir=./repos

Now you can `git push` to the hub and the drones will `git fetch` from the hub.
Just do:

    $ cd ~/projects/somerepo
    $ git push http://hubhost:6001/somerepo master

To deploy the code, use the git commit hash that you want to deploy and specify
the commands you want to run after the `--`:

    $ 

todo
====

* propagit repl
    
* propagit log

* propagit list

* propagit deploy repo/commithash command

* port mapping?

install
=======

With [npm](http://npmjs.org) do:

    npm install -g propagit
