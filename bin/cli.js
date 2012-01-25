#!/usr/bin/env node
var argv = require('optimist').argv;
var figc = require('figc');
var propagit = require('../');

var cmd = argv._[0];
if (argv._[1]) {
    argv = figc(argv._[1]);
}

if (cmd === 'drone') {
    var s = argv.hub.toString().split(':');
    var opts = {
        host : s[1] ? s[0] : 'localhost',
        port : parseInt(s[1] || s[0], 10),
    };
    
    propagit(argv.secret).connect(opts, function (c) {
        c.on('error', function (err) {
            console.error(err && err.stack || err);
        });
        
        c.on('up', function () {
            console.log('connected to the hub');
        });
        
        c.on('reconnect', function () {
            console.log('reconnecting to the hub');
        });
        
        c.on('down', function () {
            console.log('disconnected from the hub');
        });
        
        c.on('spawn', function (cmd, args, emit) {
            var ps = spawn(cmd, args);
            if (typeof emit === 'function') {
                ps.stdout.on('data', function (buf) {
                    emit('data', buf.toString());
                });
                ps.stderr.on('data', function (buf) {
                    emit('data', buf.toString());
                });
                ps.stdout.on('end', function () { emit('end') });
                ps.stderr.on('end', function () { emit('end') });
            }
            else if (typeof emit === 'object') {
                if (typeof emit.stdout === 'function') {
                    ps.stdout.on('data', function (buf) {
                        emit('data', buf.toString());
                    });
                }
            }
        });
    });
}
else if (cmd === 'hub') {
    propagit(argv.secret).listen(argv.port);
}
