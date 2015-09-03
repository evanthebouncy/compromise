// to make a measurer, it takes in a controller, along with a trial number
// and other stuffs to abstract / sample etc
// and gives a measurement of how good the result is
function mk_measurer (abstr_pre, abstr_post, pre, post, ctrl, trialN) {
  var measurer = {
    score : 0.0,
    trialn : 0,
    on_terminate : function (bodies) {
      var boxA = bodies[0]
      var boxB = bodies[1]
      var abstr_state = abstr_post.abstraction(boxA, boxB)
      var trial_score = post.soft_sat(abstr_state)
      this.score += trial_score
      this.run1() 
    }, 
    run1 : function () {
      ctrl.clear()
      if (this.trialn < trialN) {
        this.trialn += 1
        var concrete_state = abstr_pre.concretize(pre.sample())
        simulate(concrete_state, ctrl, this, "on_terminate")
      }
      else {
        console.log("done!", this.trialn)
        console.log("score ", this.score)
        clear_world()
      }
    } 
  }
  return measurer
}
