// 'use strict';
//
// const HOST       = '',
// 	  USERNAME   = '',
// 	  PASSWORD   = '',
// 	  DEVICE_ID1 = '13HC00137',
// 	  DEVICE_ID2 = '915A022E3';
//
// var cp     = require('child_process'),
// 	assert = require('assert'),
// 	stream;
//
// describe('Stream', function () {
// 	this.slow(5000);
//
// 	after('terminate child process', function () {
// 		stream.kill('SIGKILL');
// 	});
//
// 	describe('#spawn', function () {
// 		it('should spawn a child process', function () {
// 			assert.ok(stream = cp.fork(process.cwd()), 'Child process not spawned.');
// 		});
// 	});
//
// 	describe('#handShake', function () {
// 		it('should notify the parent process when ready within 5 seconds', function (done) {
// 			this.timeout(5000);
//
// 			stream.on('message', function (message) {
// 				if (message.type === 'ready')
// 					done();
// 				else if (message.type === 'requestdeviceinfo') {
// 					if (message.data.deviceId === DEVICE_ID1 || message.data.deviceId === DEVICE_ID2) {
// 						stream.send({
// 							type: message.data.requestId,
// 							data: {
// 								_id: message.data.deviceId
// 							}
// 						});
// 					}
// 				}
// 				else if (message.type === 'data') {
// 					console.log({
// 						device: message.data.device,
// 						data: JSON.parse(message.data.data)
// 					});
// 				}
// 			});
//
// 			stream.send({
// 				type: 'ready',
// 				data: {
// 					options: {
// 						host: HOST,
// 						user: USERNAME,
// 						password: PASSWORD
// 					}
// 				}
// 			}, function (error) {
// 				assert.ifError(error);
// 			});
// 		});
// 	});
//
// 	describe('#sync', function () {
// 		it('should process sync request', function (done) {
// 			this.timeout(21000);
//
// 			stream.send({
// 				type: 'sync',
// 				data: {
// 					last_sync_dt: new Date()
// 				}
// 			}, function (error) {
// 				assert.ifError(error);
//
// 				setTimeout(done, 20000);
// 			});
// 		});
// 	});
// });