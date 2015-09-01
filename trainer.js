// to make a measurer, it takes in a controller, along with a trial number
// and other stuffs to abstract / sample etc
// and gives a measurement of how good the result is
function mk_measurer (abstr_pre, abstr_post, pre, post, ctrl, trialN) {
  var measurer = {
    trialn : 0,
    run1 : function () {
      ctrl.clear()
      if (this.trialn < trialN) {
        this.trialn += 1
        var concrete_state = abstr_pre.concretize(pre.sample())
        simulate(concrete_state, ctrl, this, "run1")
      }
      else {
        console.log("done!", this.trialn)
      }
    } 
  }
  return measurer
}
