module.exports = Scheduler;

function Scheduler() {
	this._tasks = [];
}

Scheduler.prototype = {
	add: function(t, handleError) {
		this._schedule({
			run: t, handleError: handleError,
			period: 0, deadline: 0, arrival: 0
		});
	},

	cancel: function(t) {
		this._tasks.some(function(task, i, tasks) {
			if(task.run === t) {
				tasks.splice(i, 1);
				return true;
			}
		});
	},

	shutdown: function() {
		this.tasks.forEach(function(t) {
			this.cancel(t);
		}, this);
		this._tasks = void 0;
	},

	_schedule: function(task) {
		var now = Date.now();
		this._insertTask(now, task, task.period);
		this._scheduleNextRun(now);
	},

	_insertTask: function(now, task, period) {
		task.deadline = task.deadline > 0
			? task.deadline + period
			: now + task.period;

		task.arrival = task.arrival > 0
			? task.arrival + period
			: now;

		insertByDeadline(this._tasks, task);
	},

	_scheduleNextRun: function(now) {
		var self = this;
		var nextArrival = Math.max(0, this._tasks[0].arrival - now);

		if(this._timer) {
			clearTimeout(this._timer);
			this._timer = void 0;
		}

		this._timer = setTimeout(function() {
			self._runReadyTasks();
		}, nextArrival);
	},

	_runReadyTasks: function() {
		var task, next, now = Date.now();
		var currentWindow = now + 10;
		while(this._tasks.length > 0 && this._tasks[0].arrival <= currentWindow) {
			task = this._tasks.shift();
			next = runTask(task);
			this._scheduleNextTask(task, next);
		}

		this._scheduleNextRun(now);
	},

	_scheduleNextTask: function(task, period) {
		if(typeof period !== 'number') {
			period = task.period;
		}
		if(period < 0) {
			return;
		}

		this._insertTask(Date.now(), task, Math.max(0, period));
	}
};

function runTask(task) {
	try {
		return task.run();
	} catch(e) {
		if(typeof task.handleError === 'function') {
			task.handleError(e);
		} else {
			fatal(e);
		}
	}
}

function insertByDeadline (tasks, task) {
	for (var t, i = tasks.length - 1; i >= 0; --i) {
		t = tasks[i];
		if (t.deadline < task.deadline) {
			tasks.splice(i + 1, 0, task);
			return;
		}
	}

	tasks.unshift(task);
}

function fatal (e) {
	setTimeout(function () {
		throw e;
	}, 0);
}