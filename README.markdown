propagit
========

Cascading multi-server git deployment.

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

    $ propagit deploy --hub 6000 --secret beepboop \
      somerepo ed56c6e85731d412fe22cf437cb63130afc34b07 -- \
      node server.js 8085
    Listening on :8085
    ^C

todo
====

* propagit repl
    
* propagit log

* propagit list

* port mapping?

* process management

install
=======

With [npm](http://npmjs.org) do:

    npm install -g propagit
