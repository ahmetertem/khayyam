module.exports = (vorpal) => {
  return vorpal
    .command('clear', 'Clear the outputs.')
    .action(function (args, cbk) {
      let blank = ''
      for (var i = 0; i < process.stdout.rows; ++i) {
        blank += '\n'
      }
      vorpal.ui.redraw(blank)
      vorpal.ui.redraw('')
      cbk()
    })
}