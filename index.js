var gitEmit = require('git-emit');
var pushover = require('pushover');
var dnode = require('dnode');
var upnode = require('upnode');
var EventEmitter = require('events').EventEmitter;

module.exports = function (secret) {
    return new Propagit(secret);
};

function Propagit (secret) {
    this.secret = secret;
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
            else conn.emit('up', res)
        });
    });
    
    var inst = upnode(function (remote, conn) {
        this.spawn = function (cmd, args, emit) {
            self.emit('spawn', cmd, args, emit);
        };
    });
    var hub = self.hub = inst.connect.apply(inst, args);
    
    [ 'up', 'reconnect', 'down' ].forEach(function (name) {
        hub.on(name, self.emit.bind(self, name));
    });
    
    cb(self);
    return self;
};

Propagit.prototype.listen = function (port) {
    var self = this;
    var server = dnode(function (remote, conn) {
        this.auth = function (secret, cb) {
            if (typeof cb !== 'function') return
            else if (self.secret === secret) {
                cb(null, {});
            }
            else cb('ACCESS DENIED')
        };
    });
    server.use(upnode.ping);
    server.listen(port);
};
