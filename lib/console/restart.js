var child_process = require('child_process')

function start(nodefile) {
  if (typeof start !== 'string') {
    console.log('Has none file. like this: start("app.js")');
  }

  console.log('Master process is running.');

  var proc = child_process.spawn('node', [nodefile]);

  // 监测退出事件，删除原进程并开启新进程
  proc.on('exit', function (code) {
    console.log('child process exited with code ' + code);
    delete(proc);
    setTimeout(start, 5000, __filename);
  });
}
module.exports = function (vorpal, app) {
  vorpal.command('restart', 'Restart the console')
    .action(function (args, callback) {
      start(__filename);
    })
}