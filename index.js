var dnode = require('dnode');
var upnode = require('upnode');
var EventEmitter = require('events').EventEmitter;
var pushover = require('pushover');
var fs = require('fs');
var mkdirp = require('mkdirp');

module.exports = function (secret) {
    return new Propagit(secret);
};

var logger = function (uid) {
    return function (name, buf) {
        if (name === 'data') {
            var lines = buf.toString().split('\n');
            lines.forEach(function (line) {
                console.log('[' + uid + '] ' + line);
            });
        }
    };
};

function Propagit (opts) {
    if (typeof opts === 'string') {
        opts = { secret : opts };
    }
    this.secret = opts.secret;
    this.repodir = opts.repodir || process.cwd() + '/repos';
    mkdirp(this.repodir);
}

Propagit.prototype = new EventEmitter;

Propagit.prototype.connect = function () {
    var self = this;
    
    var argv = [].slice.call(arguments).reduce(function (acc, arg) {
        if (typeof arg === 'function') acc.cb = arg
        else acc.args.push(arg)
        return acc;
    }, { args : [] });
    
    var cb = argv.cb;
    var args = argv.args.concat(function (remote, conn) {
        remote.auth(self.secret, function (err, res) {
            if (err) self.emit('error', err)
            else {
                self.ports = res.ports;
                conn.emit('up', res);
            };
        });
    });
    
    var uid = (Math.random() * Math.pow(16,8)).toString(16);
    var inst = upnode(function (remote, conn) {
        this.spawn = function (cmd, args, emit) {
            self.emit('spawn', cmd, args, emit);
        };
        
        this.create = function (repo, emit) {
            self.emit('create', repo, emit);
        };
        
        this.fetch = function (repo, emit) {
            self.emit('fetch', repo, emit);
        };
        
        this.name = uid;
    });
    var hub = self.hub = inst.connect.apply(inst, args);
    
    [ 'up', 'reconnect', 'down' ].forEach(function (name) {
        hub.on(name, self.emit.bind(self, name));
    });
    
    cb(self);
    return self;
};

Propagit.prototype.listen = function (controlPort, gitPort) {
    var self = this;
    self.drones = [];
    
    var server = dnode(function (remote, conn) {
        this.auth = function (secret, cb) {
            if (typeof cb !== 'function') return
            else if (self.secret === secret) {
                self.drones.push(remote);
                conn.on('end', function () {
                    var ix = self.drones.indexOf(remote);
                    if (ix >= 0) self.drones.splice(ix, 1);
                });
                
                cb(null, {
                    ports : {
                        control : controlPort,
                        git : gitPort,
                    },
                });
                
                fs.readdir(self.repodir, function (err, repos) {
                    if (err) console.error(err)
                    else repos.forEach(function (repo) {
                        var log = logger(remote.name);
                        remote.create(repo, function (name) {
                            if (name === 'end') {
                                remote.fetch(repo, log);
                            }
                            log.apply(null, arguments);
                        });
                    });
                });
            }
            else cb('ACCESS DENIED')
        };
    });
    server.use(upnode.ping);
    server.listen(controlPort);
    
    var repos = self.repos = pushover(self.repodir);
    repos.on('push', function (repo) {
        self.emit('push', repo);
        self.drones.forEach(function (drone) {
            drone.fetch(repo, logger(drone.name));
        });
    });
    repos.listen(gitPort);
};
