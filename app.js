'use strict';

let platform  = require('./platform'),
	async     = require('async'),
	Client    = require('ftp'),
	ftpClient = new Client(),
	config;

let sync = function (path, callback) {
	ftpClient.list(path, (err, items) => {
		console.log(items);
		if (err) return platform.handleException(err);

		if (config.device_id === 'Folder Name' && path !== config.path) {
			let deviceId = path.substr(path.lastIndexOf('/') + 1);

			platform.requestDeviceInfo(deviceId, (err, requestId) => {
				let t = setTimeout(() => {
					callback();
				}, 10000);

				platform.once(requestId, () => {
					clearTimeout(t);

					async.each(items, (item, done) => {
						if (item.type === 'd' && config.recursive)
							sync(`${path}/${item.name}`, done);
						else if (item.type === '-') {
							ftpClient.get(`${path}/${item.name}`, (err, stream) => {
								if (err) return platform.handleException(err);

								let contents = '';

								stream.once('error', function (err) {
									platform.handleException(err);
									stream.removeAllListeners();
									done();
								});

								stream.on('data', function (chunk) {
									contents += chunk;
								}).on('end', function () {
									console.log('File', item.name);
									console.log('Contents', contents);
									platform.processData(deviceId, JSON.stringify({
										data: contents
									}));

									platform.log(JSON.stringify({
										file_read: deviceId
									}));

									stream.removeAllListeners();
									done();
								});
							});
						}
						else
							done();
					}, callback);
				});
			});
		}
		else {
			async.each(items, (item, done) => {
				if (item.type === 'd' && path === config.path)
					sync(`${path}/${item.name}`, done);
				else if (item.type === 'd' && config.recursive)
					sync(`${path}/${item.name}`, done);
				else if (item.type === '-') {
					platform.requestDeviceInfo(item.name, (err, requestId) => {
						let t = setTimeout(() => {
							done();
						}, 10000);

						platform.once(requestId, () => {
							clearTimeout(t);

							ftpClient.get(`${path}/${item.name}`, (err, stream) => {
								if (err) return platform.handleException(err);

								let contents = '';

								stream.once('error', function (err) {
									platform.handleException(err);
									stream.removeAllListeners();
									done();
								});

								stream.on('data', function (chunk) {
									contents += chunk;
								}).on('end', function () {
									console.log('File', item.name);
									console.log('Contents', contents);
									platform.processData(item.name, JSON.stringify({
										data: contents
									}));

									platform.log(JSON.stringify({
										file_read: item.name
									}));

									stream.removeAllListeners();
									done();
								});
							});
						});
					});
				}
				else
					done();
			}, callback);
		}
	});
};

/**
 * Emitted when the platform issues a sync request. Means that the stream plugin should fetch device data from the 3rd party service.
 * @param {date} lastSyncDate Timestamp from when the last sync happened. Allows you to fetch data from a certain point in time.
 */
platform.on('sync', function () {
	sync(config.path, () => {
		platform.log('FTP Stream sync executed.');
	});
});

/**
 * Emitted when the platform shuts down the plugin. The Stream should perform cleanup of the resources on this event.
 */
platform.once('close', function () {
	let d = require('domain').create();

	d.once('error', function (error) {
		console.error(error);
		platform.handleException(error);
		platform.notifyClose();
		d.exit();
	});

	d.run(function () {
		ftpClient.end();
		platform.notifyClose();
		d.exit();
	});
});

/**
 * Emitted when the platform bootstraps the plugin. The plugin should listen once and execute its init process.
 * Afterwards, platform.notifyReady() should be called to notify the platform that the init process is done.
 * @param {object} options The parameters or options. Specified through config.json.
 */
platform.once('ready', function (options) {
	options.port = options.port || 21;
	options.path = options.path || '/';
	options.device_id = options.device_id || 'Folder Name';

	ftpClient.on('error', function (err) {
		console.error(err);
		platform.handleException(err);

		ftpClient.destroy();

		setTimeout(() => {
			process.exit(1);
		}, 10000);
	});

	ftpClient.on('ready', function () {
		platform.notifyReady();
		platform.log('FTP Stream has been initialized.');
	});

	console.log(options);
	ftpClient.connect(options);
	config = options;
});