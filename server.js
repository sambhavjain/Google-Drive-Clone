'use strict'
const express = require('express'),
	app    	= express(),
	server 	= require('http').createServer(app),
	io 		= require('socket.io')(server),
 	client 	= require("socket.io-client"),
 	ss 		= require("socket.io-stream"),
 	// stream = ss.createStream(),
 	// stream1 = ss.createStream(),
 	fs 		= require('fs'),	
 	path 	= require('path')	,	
 	mkdirp 	= require('mkdirp'),
 	chokidar= require('chokidar');

io.on('connection', function(socket){
	console.log('a user connected')
	var defaultChannel = 'general'
	// socket.emit('you are connected with id '+socket.id);
	socket.on('connect', function(data){
		data.channel = defaultChannel;
		socket.join(defaultChannel);
		console.log(data)
		// io.in(defaultChannel).emit
	})
	let watcher1 = chokidar.watch('./iCloud', {ignored: /[\/\\]\./});
	// .on('all', (event, path) => {
	//   // socket.emit('') 
	// });
	let log = console.log.bind(console);
	// Add event listeners. 
	watcher1
	  .on('add', function(path){
	  	socket.emit('file-added', path)
	  	let stream = ss.createStream()
	  	var filename = path.replace(/^.*[\\\/]/, '')
		ss(socket).emit('file', stream, {name: filename});
		fs.createReadStream(path).pipe(stream);
	  })
	  .on('change', function(path){
	  	socket.emit('file-change', path)
	  	let stream = ss.createStream()
	  	var filename = path.replace(/^.*[\\\/]/, '')
	  	ss(socket).emit('changed-file', stream, {name: filename});
		fs.createReadStream(path).pipe(stream);
	  })
	  .on('unlink', function(path){
	  	socket.emit('file-deleted', path)})
	  .on('addDir', function(path){
	  	socket.emit('dir-added', path)
	  })
	  .on('unlinkDir', function(path){
	  	socket.emit('dir-deleted', path)})
	  .on('error', error => log(`Watcher error: ${error}`))

	socket.on('dir-added', function(filepath){
		console.log(filepath + ' directory added')
		mkdirp('./iCloud', function (err) {
		    if (err) console.error(err)
		    else console.log('dir created for server')
		})
		
	})
	socket.on('file-added', function(filepath){
		console.log(filepath + ' file added to server')
		ss(socket).on('file', function(stream, data) {
			console.log(data)
		    var filename = path.basename(data.name);
		    stream.pipe(fs.createWriteStream('./iCloud/'+filename));
		});
	})
	socket.on('file-change', function(filepath){
		console.log(filepath + ' has changed')
		ss(socket).on('edited-file', function(stream, data) {
			console.log(data)
		    var filename = path.basename(data.name);
		    stream.pipe(fs.createWriteStream('./iCloud/'+filename));
		});
	})
	socket.on('file-deleted', function(path){
		fs.unlink(path,function(err){
	        if(err) return console.log(err);
	        else console.log('file deleted successfully');       
   		});
		console.log(path + ' has deleted')
	})
	socket.on('dir-deleted', function(path){
		console.log(path + ' dir deleted')
	})

})
app.get('/', function(req, res){
	var socket = client.connect('http://localhost:3000')
	// socket.on('connect', 'connected')
	mkdirp('../iCloud', function (err) {
	    if (err) console.error(err)
	    else console.log('done')
	})
	//file watcher
	let watcher2 = chokidar.watch('../iCloud', {ignored: /[\/\\]\./});
	// .on('all', (event, path) => {
	//   // socket.emit('') 
	// });
	let log = console.log.bind(console);
	// Add event listeners. 
	watcher2
	  .on('add', function(path){
	  	socket.emit('file-added', path)
	  	let stream = ss.createStream();
	  	var filename = path.replace(/^.*[\\\/]/, '')
		ss(socket).emit('file', stream, {name: filename});
		fs.createReadStream(path).pipe(stream);
	  })
	  .on('change', function(path){
	  	socket.emit('file-change', path)
	  	let stream = ss.createStream();
	  	var filename = path.replace(/^.*[\\\/]/, '')

	  	ss(socket).emit('edited-file', stream, {name: filename});
		fs.createReadStream(path).pipe(stream);
	  })
	  .on('unlink', function(path){
	  	socket.emit('file-deleted', path)})
	  .on('addDir', function(path){
	  	socket.emit('dir-added', path)
	  
	})
	  .on('unlinkDir', function(path){
	  	socket.emit('dir-deleted', path)})
	  .on('error', error => log(`Watcher error: ${error}`))

	 socket.on('dir-added', function(filepath){
		console.log(filepath + ' directory added')
		mkdirp('../iCloud', function (err) {
		    if (err) console.error(err)
		    else console.log('dir created for client')
		})
		
	})
	socket.on('file-added', function(filepath){
		console.log(filepath + ' file added to client')
		ss(socket).on('file', function(stream1, data) {
			console.log(data)
		    var filename = path.basename(data.name);
		    stream1.pipe(fs.createWriteStream('../iCloud/'+filename));
		});
	})
	socket.on('file-change', function(filepath){
		console.log(filepath + ' has changed')
		ss(socket).on('changed-file', function(stream, data) {
			console.log(data)
		    var filename = path.basename(data.name);
		    stream.pipe(fs.createWriteStream('../iCloud/' + filename));
		});
	})
	socket.on('file-deleted', function(path){
		fs.unlink('../'+path,function(err){
	        if(err) return console.log(err);
	        else console.log('file deleted successfully');       
   		});
		console.log(path + ' has deleted')
	})
})


server.listen(3000, function(){
	console.log('server is listening on port 3000');
})